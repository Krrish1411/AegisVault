import type {
  VaultService,
  CreateVaultInput,
  UnlockVaultInput,
  RecoverVaultInput,
} from './VaultService';
import type {
  DecryptedVaultDomain,
  VaultItemEnvelope,
  VaultSettings,
  VaultFolder,
  AuditEvent,
  LoginPayload,
  AttachmentMetadata,
  VaultRecord,
  EmergencyContact,
} from '@/domain/vault/types';
import { createEmergencyGrantPackage } from '@/domain/emergency/emergencyAccessEngine';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';
import type { VaultRepository } from '@/storage/ports/VaultRepository';
import { dexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import {
  createEncryptedVault,
  unlockEncryptedVault,
  unlockEncryptedVaultWithRecovery,
  rewrapVaultKeyWithNewPassword,
  reencryptVaultPayload,
} from '@/security/crypto/vaultCrypto';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import { generateRecoveryPhrase } from '@/security/crypto/bip39';
import { exportEncryptedVault, importEncryptedVault } from '@/security/export/vaultExport';
import { FORMAT_VERSION, CRYPTO_PROFILE } from '@/security/serialization/vaultSerializer';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import { validateFolderMove, getDescendantFolderIds } from '@/domain/organization/folderTree';
import {
  encryptAttachmentBlob,
  decryptAttachmentBlob,
  validateAttachmentSize,
} from '@/domain/attachments/attachmentEngine';
import {
  VaultNotFoundError,
  AuthenticationFailedError,
  VaultItemNotFoundError,
  VaultCorruptedError,
  ValidationError,
} from '@/lib/errors/VaultError';
import { useSessionStore } from '@/state/sessionStore';
import { useUiStore } from '@/state/uiStore';
import { logger } from '@/lib/logger';

export class AppVaultService implements VaultService {
  private repository: VaultRepository;
  private cryptoProvider: SodiumCryptoProvider;
  private inMemoryDomain: DecryptedVaultDomain | null = null;
  private inMemoryVaultKey: Uint8Array | null = null;
  private listeners = new Set<() => void>();

  constructor(
    repository: VaultRepository = dexieVaultRepository,
    cryptoProvider: SodiumCryptoProvider = new SodiumCryptoProvider()
  ) {
    this.repository = repository;
    this.cryptoProvider = cryptoProvider;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        logger.error('Error in vault listener', { error: e instanceof Error ? e.message : String(e) });
      }
    });
    try {
      useUiStore.getState().bumpVaultRevision();
    } catch {
      // safe fallback
    }
  }

  async isVaultCreated(): Promise<boolean> {
    return await this.repository.exists();
  }

  async createVault(input: CreateVaultInput): Promise<{ recoveryPhrase: string }> {
    const vaultId = `vault-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const recoveryPhrase = input.recoveryPhrase ? input.recoveryPhrase.trim() : generateRecoveryPhrase();

    const initialSettings: VaultSettings = {
      ...DEFAULT_VAULT_SETTINGS,
      ...input.settings,
    };

    const initialAudit: AuditEvent = {
      id: `audit-${Date.now()}-init`,
      action: 'vault_created',
      timestamp: now,
      details: {
        vaultName: input.vaultName,
      },
    };

    const initialDomain: DecryptedVaultDomain = {
      metadata: {
        id: vaultId,
        name: input.vaultName,
        createdAt: now,
        updatedAt: now,
        formatVersion: FORMAT_VERSION,
        cryptoProfile: CRYPTO_PROFILE,
      },
      settings: initialSettings,
      vaults: [
        {
          id: 'vault-personal',
          name: 'Personal Vault',
          description: 'Primary private vault for logins, identity, and personal records',
          color: '#12855a',
          isDefault: true,
          createdAt: now,
        },
        {
          id: 'vault-work',
          name: 'Work & Tech',
          description: 'Developer keys, cloud infrastructure, and enterprise credentials',
          color: '#5865f2',
          createdAt: now,
        },
      ],
      items: [],
      folders: [],
      attachments: [],
      auditEvents: [initialAudit],
    };

    // Encrypt and persist with master password and BIP39 recovery wrapping
    const { container, vaultKey } = await createEncryptedVault(
      input.masterPassword,
      initialDomain,
      recoveryPhrase
    );
    await this.repository.create(container);

    // Set in-memory session and index
    this.inMemoryDomain = initialDomain;
    this.inMemoryVaultKey = vaultKey;
    inMemorySearchIndex.buildIndex(initialDomain);

    useSessionStore.getState().unlock(input.vaultName);
    this.notify();
    logger.info('Vault created and initialized successfully with BIP39 recovery wrap', {
      component: 'AppVaultService',
      vaultId,
    });

    return {
      recoveryPhrase,
    };
  }

  async unlockVault(input: UnlockVaultInput): Promise<void> {
    const container = await this.repository.read();
    if (!container) {
      throw new VaultNotFoundError('No vault found on this device');
    }

    const { domain, vaultKey } = await unlockEncryptedVault(input.masterPassword, container);

    this.inMemoryDomain = domain;
    this.inMemoryVaultKey = vaultKey;
    inMemorySearchIndex.buildIndex(domain);

    useSessionStore.getState().unlock(domain.metadata.name);
    this.notify();
    logger.info('Vault unlocked successfully', { component: 'AppVaultService', vaultId: domain.metadata.id });
  }

  async lockVault(): Promise<void> {
    // Purge key material and decrypted domain from memory
    if (this.inMemoryVaultKey) {
      this.inMemoryVaultKey.fill(0);
      this.inMemoryVaultKey = null;
    }
    this.inMemoryDomain = null;
    inMemorySearchIndex.clear();

    useSessionStore.getState().lock();
    this.notify();
    logger.info('Vault locked, decrypted memory cleared', { component: 'AppVaultService' });
  }

  async recoverVault(input: RecoverVaultInput): Promise<void> {
    const container = await this.repository.read();
    if (!container) {
      throw new VaultNotFoundError('No vault container found on this device');
    }

    // 1. Decrypt using BIP39 recovery phrase
    const { domain, vaultKey } = await unlockEncryptedVaultWithRecovery(
      input.recoveryPhrase,
      container
    );

    // 2. Re-wrap Vault Key with the new master password
    const rewrappedContainer = await rewrapVaultKeyWithNewPassword(
      vaultKey,
      input.newMasterPassword,
      container
    );

    // 3. Atomically persist updated container
    await this.repository.replaceAtomically(rewrappedContainer);

    this.inMemoryDomain = domain;
    this.inMemoryVaultKey = vaultKey;
    inMemorySearchIndex.buildIndex(domain);

    useSessionStore.getState().unlock(domain.metadata.name);
    this.notify();
    logger.info('Vault recovered successfully with BIP39 recovery phrase and re-wrapped with new master password', {
      component: 'AppVaultService',
      vaultId: domain.metadata.id,
    });
  }

  async changeMasterPassword(newMasterPassword: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const auditEvent: AuditEvent = {
      id: `audit-${Date.now()}-pw-change`,
      action: 'master_password_changed',
      timestamp: now,
    };

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      auditEvents: [auditEvent, ...domain.auditEvents],
    };

    // Re-encrypt payload with audit event, then re-wrap key
    const containerWithPayload = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    const nextContainer = await rewrapVaultKeyWithNewPassword(
      vaultKey,
      newMasterPassword,
      containerWithPayload
    );

    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
    this.notify();

    logger.info('Master password changed successfully (Vault Key re-wrapped)', {
      component: 'AppVaultService',
      vaultId: domain.metadata.id,
    });
  }

  async exportVault(backupPassword: string): Promise<string> {
    const { domain } = this.ensureUnlocked();
    return await exportEncryptedVault(domain, backupPassword);
  }

  async importVault(
    backupJson: string,
    backupPassword: string,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    // 1. Decrypt and strictly validate the imported backup
    const importedDomain = await importEncryptedVault(backupJson, backupPassword);

    const now = new Date().toISOString();
    let nextDomain: DecryptedVaultDomain;

    if (mode === 'replace') {
      nextDomain = {
        ...importedDomain,
        metadata: {
          ...importedDomain.metadata,
          updatedAt: now,
        },
        auditEvents: [
          {
            id: `audit-${Date.now()}-import`,
            action: 'vault_imported_replace',
            timestamp: now,
          },
          ...importedDomain.auditEvents,
        ],
      };
    } else {
      // Merge mode: Add items that do not exist by ID
      const existingIds = new Set(domain.items.map((i) => i.id));
      const newItems = importedDomain.items.filter((i) => !existingIds.has(i.id));

      const existingFolderIds = new Set(domain.folders.map((f) => f.id));
      const newFolders = importedDomain.folders.filter((f) => !existingFolderIds.has(f.id));

      nextDomain = {
        ...domain,
        metadata: {
          ...domain.metadata,
          updatedAt: now,
        },
        items: [...domain.items, ...newItems],
        folders: [...domain.folders, ...newFolders],
        auditEvents: [
          {
            id: `audit-${Date.now()}-import-merge`,
            action: 'vault_imported_merge',
            timestamp: now,
            details: {
              itemsAdded: newItems.length,
            },
          },
          ...domain.auditEvents,
        ],
      };
    }

    // 2. Re-encrypt payload and atomically commit
    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
    this.notify();

    logger.info(`Vault backup imported successfully (${mode} mode)`, {
      component: 'AppVaultService',
      itemCount: nextDomain.items.length,
    });
  }

  getDecryptedVault(): DecryptedVaultDomain | null {
    return this.inMemoryDomain;
  }

  private ensureUnlocked(): { domain: DecryptedVaultDomain; vaultKey: Uint8Array } {
    if (!this.inMemoryDomain || !this.inMemoryVaultKey) {
      throw new AuthenticationFailedError('Vault is locked. Please unlock before mutating data.');
    }
    return {
      domain: this.inMemoryDomain,
      vaultKey: this.inMemoryVaultKey,
    };
  }

  async saveItem(item: VaultItemEnvelope): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const existingIndex = domain.items.findIndex((i) => i.id === item.id);

    const updatedItem: VaultItemEnvelope = {
      ...item,
      updatedAt: now,
    };

    let nextItems: VaultItemEnvelope[];
    if (existingIndex >= 0) {
      nextItems = [...domain.items];
      nextItems[existingIndex] = updatedItem;
    } else {
      nextItems = [...domain.items, updatedItem];
    }

    const auditEvent: AuditEvent = {
      id: `audit-${Date.now()}-${item.id}`,
      action: existingIndex >= 0 ? 'item_updated' : 'item_created',
      timestamp: now,
      details: {
        itemType: item.type,
      },
    };

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      auditEvents: [auditEvent, ...domain.auditEvents],
    };

    // Re-encrypt and commit atomically
    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
    this.notify();

    logger.info(`Vault item saved (${item.type})`, { component: 'AppVaultService', itemId: item.id });
  }

  async deleteItem(itemId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const nextItems = domain.items.filter((i) => i.id !== itemId);

    const auditEvent: AuditEvent = {
      id: `audit-${Date.now()}-${itemId}`,
      action: 'item_deleted',
      timestamp: now,
    };

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      auditEvents: [auditEvent, ...domain.auditEvents],
    };

    // Re-encrypt and commit atomically
    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
    this.notify();

    logger.info('Vault item deleted', { component: 'AppVaultService', itemId });
  }

  async toggleFavoriteItem(itemId: string): Promise<void> {
    const { domain } = this.ensureUnlocked();
    const item = domain.items.find((i) => i.id === itemId);
    if (!item) {
      throw new VaultItemNotFoundError(`Item with id ${itemId} not found`);
    }

    await this.saveItem({
      ...item,
      favorite: !item.favorite,
    });
  }

  async toggleArchiveItem(itemId: string): Promise<void> {
    const { domain } = this.ensureUnlocked();
    const item = domain.items.find((i) => i.id === itemId);
    if (!item) {
      throw new VaultItemNotFoundError(`Item with id ${itemId} not found`);
    }

    await this.saveItem({
      ...item,
      archived: !item.archived,
    });
  }

  // --- Folder Management ---

  async createFolder(name: string, parentId?: string): Promise<VaultFolder> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const trimmed = name.trim();
    if (!trimmed) {
      throw new ValidationError('Folder name cannot be empty');
    }

    if (parentId && !domain.folders.some((f) => f.id === parentId)) {
      throw new ValidationError(`Parent folder ${parentId} does not exist`);
    }

    const now = new Date().toISOString();
    const newFolder: VaultFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      ...(parentId ? { parentId } : {}),
    };

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      folders: [...domain.folders, newFolder],
      auditEvents: [
        {
          id: `audit-${Date.now()}-folder-create`,
          action: 'folder_created',
          timestamp: now,
          details: { name: trimmed },
        },
        ...domain.auditEvents,
      ],
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);

    return newFolder;
  }

  async updateFolder(folderId: string, updates: Partial<VaultFolder>): Promise<VaultFolder> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const index = domain.folders.findIndex((f) => f.id === folderId);
    if (index === -1) {
      throw new ValidationError(`Folder with id ${folderId} not found`);
    }

    const existing = domain.folders[index]!;

    // If changing parent, validate no circular dependencies
    if (updates.parentId !== undefined && updates.parentId !== existing.parentId) {
      const isValid = validateFolderMove(domain.folders, folderId, updates.parentId);
      if (!isValid) {
        throw new ValidationError('Cannot move folder into itself or one of its subfolders');
      }
    }

    const now = new Date().toISOString();
    const updatedFolder: VaultFolder = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    const nextFolders = [...domain.folders];
    nextFolders[index] = updatedFolder;

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      folders: nextFolders,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);

    return updatedFolder;
  }

  async deleteFolder(
    folderId: string,
    deleteItemsOption: 'move_to_root' | 'delete_all' = 'move_to_root'
  ): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const folder = domain.folders.find((f) => f.id === folderId);
    if (!folder) {
      throw new ValidationError(`Folder with id ${folderId} not found`);
    }

    const descendantIds = new Set([folderId, ...getDescendantFolderIds(domain.folders, folderId)]);
    const now = new Date().toISOString();

    let nextItems: VaultItemEnvelope[];
    if (deleteItemsOption === 'delete_all') {
      nextItems = domain.items.filter((i) => !i.folderId || !descendantIds.has(i.folderId));
    } else {
      // Move to root
      nextItems = domain.items.map((i) => {
        if (i.folderId && descendantIds.has(i.folderId)) {
          const { folderId: _, ...rest } = i;
          return { ...rest, updatedAt: now } as VaultItemEnvelope;
        }
        return i;
      });
    }

    const nextFolders = domain.folders.filter((f) => !descendantIds.has(f.id));

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      folders: nextFolders,
      auditEvents: [
        {
          id: `audit-${Date.now()}-folder-del`,
          action: 'folder_deleted',
          timestamp: now,
          details: { folderName: folder.name, deleteOption: deleteItemsOption },
        },
        ...domain.auditEvents,
      ],
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
  }

  // --- Password History Operations ---

  async restorePasswordFromHistory(itemId: string, historyEntryId: string): Promise<void> {
    const { domain } = this.ensureUnlocked();
    const item = domain.items.find((i) => i.id === itemId);
    if (!item) {
      throw new VaultItemNotFoundError(`Item with id ${itemId} not found`);
    }

    const payload = item.payload as Partial<LoginPayload>;
    const history = item.passwordHistory ?? [];
    const entry = history.find((h) => h.id === historyEntryId);
    if (!entry) {
      throw new ValidationError('Password history entry not found');
    }

    const currentPassword = payload.password;
    const now = new Date().toISOString();

    // Push current password to history before restoring
    const nextHistory = [
      ...(currentPassword
        ? [{ id: `hist-${Date.now()}`, password: currentPassword, archivedAt: now }]
        : []),
      ...history.filter((h) => h.id !== historyEntryId),
    ].slice(0, 10);

    const nextPayload: Record<string, unknown> = {
      ...payload,
      password: entry.password,
    };

    await this.saveItem({
      ...item,
      payload: nextPayload,
      passwordHistory: nextHistory,
    });
  }

  async deletePasswordHistoryEntry(itemId: string, historyEntryId: string): Promise<void> {
    const { domain } = this.ensureUnlocked();
    const item = domain.items.find((i) => i.id === itemId);
    if (!item) {
      throw new VaultItemNotFoundError(`Item with id ${itemId} not found`);
    }

    const history = item.passwordHistory ?? [];
    const nextHistory = history.filter((h) => h.id !== historyEntryId);

    await this.saveItem({
      ...item,
      passwordHistory: nextHistory,
    });
  }

  async clearPasswordHistory(itemId: string): Promise<void> {
    const { domain } = this.ensureUnlocked();
    const item = domain.items.find((i) => i.id === itemId);
    if (!item) {
      throw new VaultItemNotFoundError(`Item with id ${itemId} not found`);
    }

    await this.saveItem({
      ...item,
      passwordHistory: [],
    });
  }

  async updateSettings(settings: Partial<VaultSettings>): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const nextSettings: VaultSettings = {
      ...domain.settings,
      ...settings,
    };

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      settings: nextSettings,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    logger.info('Vault settings updated', { component: 'AppVaultService' });
  }

  async addAttachment(
    file: { filename: string; mediaType: string; data: Uint8Array },
    itemId?: string
  ): Promise<AttachmentMetadata> {
    await this.cryptoProvider.init();
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    validateAttachmentSize(file.data.byteLength);

    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const encryptedBlob = await encryptAttachmentBlob(file.data, vaultKey, this.cryptoProvider);

    if (this.repository.saveAttachment) {
      await this.repository.saveAttachment({
        id: attachmentId,
        nonce: encryptedBlob.nonce,
        ciphertext: encryptedBlob.ciphertext,
        sizeBytes: file.data.byteLength,
        checksumSha256: encryptedBlob.checksumSha256,
        updatedAt: Date.now(),
      });
    }

    const metadata: AttachmentMetadata = {
      id: attachmentId,
      filename: file.filename,
      mediaType: file.mediaType,
      sizeBytes: file.data.byteLength,
      createdAt: now,
    };

    let nextItems = domain.items;
    if (itemId) {
      nextItems = domain.items.map((i) => {
        if (i.id === itemId) {
          const prevAttachments = i.attachmentIds ?? [];
          return {
            ...i,
            attachmentIds: [...prevAttachments, attachmentId],
            updatedAt: now,
          };
        }
        return i;
      });
    }

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      attachments: [...domain.attachments, metadata],
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    logger.info(`Attachment added: ${file.filename} (${file.data.byteLength} bytes)`, {
      component: 'AppVaultService',
    });

    return metadata;
  }

  async getDecryptedAttachment(
    attachmentId: string
  ): Promise<{ data: Uint8Array; metadata: AttachmentMetadata }> {
    await this.cryptoProvider.init();
    const { domain, vaultKey } = this.ensureUnlocked();
    const metadata = domain.attachments.find((a) => a.id === attachmentId);
    if (!metadata) {
      throw new VaultItemNotFoundError(`Attachment ${attachmentId} not found in vault manifest`);
    }

    if (!this.repository.readAttachment) {
      throw new VaultCorruptedError('Attachment repository read not supported');
    }

    const record = await this.repository.readAttachment(attachmentId);
    if (!record) {
      throw new VaultCorruptedError(`Attachment data for ${attachmentId} missing from storage`);
    }

    const data = await decryptAttachmentBlob(record, vaultKey, this.cryptoProvider);
    return { data, metadata };
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();

    if (this.repository.deleteAttachment) {
      await this.repository.deleteAttachment(attachmentId);
    }

    const nextItems = domain.items.map((i) => {
      if (i.attachmentIds?.includes(attachmentId)) {
        return {
          ...i,
          attachmentIds: i.attachmentIds.filter((id) => id !== attachmentId),
          updatedAt: now,
        };
      }
      return i;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      attachments: domain.attachments.filter((a) => a.id !== attachmentId),
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    logger.info(`Attachment deleted: ${attachmentId}`, { component: 'AppVaultService' });
  }

  async getAttachmentTotalBytes(): Promise<number> {
    const domain = this.inMemoryDomain;
    if (!domain) return 0;
    return domain.attachments.reduce((sum, a) => sum + a.sizeBytes, 0);
  }

  async toggleFavoriteAttachment(attachmentId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const nextAttachments = domain.attachments.map((att) => {
      if (att.id === attachmentId) {
        return {
          ...att,
          favorite: !att.favorite,
        };
      }
      return att;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      attachments: nextAttachments,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    useUiStore.getState().incrementVaultRevision();
    logger.info(`Toggled favorite on attachment ${attachmentId}`, { component: 'AppVaultService' });
  }

  async linkAttachmentToItem(attachmentId: string, itemId: string | null): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const targetItem = itemId ? domain.items.find((i) => i.id === itemId) : null;

    const nextAttachments = domain.attachments.map((att) => {
      if (att.id === attachmentId) {
        return {
          ...att,
          linkedItemId: itemId ?? undefined,
          linkedItemTitle: targetItem ? targetItem.title : undefined,
        };
      }
      return att;
    });

    const nextItems = domain.items.map((i) => {
      const hasAttachment = i.attachmentIds?.includes(attachmentId);
      if (itemId && i.id === itemId) {
        if (!hasAttachment) {
          return {
            ...i,
            attachmentIds: [...(i.attachmentIds ?? []), attachmentId],
            updatedAt: now,
          };
        }
      } else if (hasAttachment && (!itemId || i.id !== itemId)) {
        return {
          ...i,
          attachmentIds: i.attachmentIds?.filter((id) => id !== attachmentId),
          updatedAt: now,
        };
      }
      return i;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
      attachments: nextAttachments,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    useUiStore.getState().incrementVaultRevision();
    logger.info(`Attachment ${attachmentId} link updated to item ${itemId}`, { component: 'AppVaultService' });
  }

  async linkItemToItem(sourceItemId: string, targetItemId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();

    const nextItems = domain.items.map((item) => {
      if (item.id === sourceItemId) {
        const existing = item.linkedItemIds ?? [];
        if (!existing.includes(targetItemId)) {
          return {
            ...item,
            linkedItemIds: [...existing, targetItemId],
            updatedAt: now,
          };
        }
      }
      if (item.id === targetItemId) {
        const existing = item.linkedItemIds ?? [];
        if (!existing.includes(sourceItemId)) {
          return {
            ...item,
            linkedItemIds: [...existing, sourceItemId],
            updatedAt: now,
          };
        }
      }
      return item;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    useUiStore.getState().incrementVaultRevision();
    logger.info(`Linked items ${sourceItemId} <-> ${targetItemId}`, { component: 'AppVaultService' });
  }

  async unlinkItemFromItem(sourceItemId: string, targetItemId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();

    const nextItems = domain.items.map((item) => {
      if (item.id === sourceItemId) {
        return {
          ...item,
          linkedItemIds: item.linkedItemIds?.filter((id) => id !== targetItemId),
          updatedAt: now,
        };
      }
      if (item.id === targetItemId) {
        return {
          ...item,
          linkedItemIds: item.linkedItemIds?.filter((id) => id !== sourceItemId),
          updatedAt: now,
        };
      }
      return item;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: {
        ...domain.metadata,
        updatedAt: now,
      },
      items: nextItems,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);

    this.inMemoryDomain = nextDomain;
    useUiStore.getState().incrementVaultRevision();
    logger.info(`Unlinked items ${sourceItemId} <-> ${targetItemId}`, { component: 'AppVaultService' });
  }

  getVaultRecords(): VaultRecord[] {
    const domain = this.inMemoryDomain;
    if (!domain) return [];
    if (domain.vaults && domain.vaults.length > 0) {
      return [...domain.vaults];
    }
    return [
      {
        id: 'vault-personal',
        name: 'Personal Vault',
        description: 'Primary private vault for logins and personal records',
        color: '#12855a',
        isDefault: true,
        createdAt: domain.metadata.createdAt,
      },
    ];
  }

  async createVaultRecord(input: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<VaultRecord> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) throw new VaultNotFoundError();

    const now = new Date().toISOString();
    const newVault: VaultRecord = {
      id: `vault-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      color: input.color ?? '#6d4aff',
      icon: input.icon ?? 'shield',
      createdAt: now,
    };

    const currentVaults = domain.vaults ?? this.getVaultRecords();
    const nextVaults = [...currentVaults, newVault];

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      vaults: nextVaults,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    this.notify();

    return newVault;
  }

  async deleteVaultRecord(vaultId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) throw new VaultNotFoundError();

    const now = new Date().toISOString();
    const currentVaults = domain.vaults ?? this.getVaultRecords();
    const nextVaults = currentVaults.filter((v) => v.id !== vaultId);

    // Reassign items from deleted vault to default vault
    const defaultVaultId = nextVaults.find((v) => v.isDefault)?.id ?? nextVaults[0]?.id ?? 'vault-personal';
    const nextItems = domain.items.map((item) => {
      if (item.vaultId === vaultId) {
        return { ...item, vaultId: defaultVaultId, updatedAt: now };
      }
      return item;
    });

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      vaults: nextVaults,
      items: nextItems,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    this.notify();
  }

  async clearAllItems(vaultId?: string): Promise<{ deletedCount: number }> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) throw new VaultNotFoundError();

    const now = new Date().toISOString();
    let nextItems: VaultItemEnvelope[];
    let deletedCount = 0;

    if (!vaultId || vaultId === 'all') {
      deletedCount = domain.items.length;
      nextItems = [];
      if (this.repository.deleteAttachment) {
        for (const att of domain.attachments) {
          try {
            await this.repository.deleteAttachment(att.id);
          } catch {
            // ignore
          }
        }
      }
    } else {
      nextItems = domain.items.filter((i) => {
        const matches = i.vaultId === vaultId || (!i.vaultId && vaultId === 'vault-personal');
        if (matches) deletedCount++;
        return !matches;
      });
    }

    const nextAttachments = (!vaultId || vaultId === 'all') ? [] : domain.attachments;

    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      items: nextItems,
      attachments: nextAttachments,
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    inMemorySearchIndex.buildIndex(nextDomain);
    this.notify();

    logger.warn('Cleared vault items', {
      component: 'AppVaultService',
      deletedCount,
      ...(vaultId ? { vaultId } : {}),
    });
    return { deletedCount };
  }

  async purgeEntireVault(): Promise<void> {
    if (this.inMemoryVaultKey) {
      this.inMemoryVaultKey.fill(0);
      this.inMemoryVaultKey = null;
    }
    this.inMemoryDomain = null;
    inMemorySearchIndex.clear();
    await this.repository.delete();
    useSessionStore.getState().reset();
    this.notify();
    logger.warn('Entire vault and attachments permanently purged from storage', {
      component: 'AppVaultService',
    });
  }

  // --- Emergency Access & Digital Legacy ---

  getEmergencyContacts(): readonly EmergencyContact[] {
    return this.inMemoryDomain?.emergencyContacts ?? [];
  }

  async addEmergencyContact(
    input: {
      name: string;
      email: string;
      relationship?: string | undefined;
      accessLevel: 'full' | 'selected';
      waitPeriodDays: number;
    },
    emergencyPin: string
  ): Promise<{ contact: EmergencyContact; grantJson: string }> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const contactId = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const itemsToGrant = input.accessLevel === 'selected'
      ? domain.items.filter((i) =>
          ['bank_account', 'credit_card', 'identity', 'insurance', 'emergency_contact', 'secure_note'].includes(i.type) ||
          i.favorite
        )
      : domain.items;

    const contact: EmergencyContact = {
      id: contactId,
      name: input.name.trim(),
      email: input.email.trim(),
      relationship: input.relationship?.trim(),
      accessLevel: input.accessLevel,
      waitPeriodDays: input.waitPeriodDays,
      status: 'active',
      createdAt: now,
    };

    const grantJson = await createEmergencyGrantPackage(
      itemsToGrant,
      contact,
      domain.metadata.name,
      emergencyPin,
      this.cryptoProvider
    );

    const contactWithGrant: EmergencyContact = {
      ...contact,
      grantData: grantJson,
    };

    const existingContacts = domain.emergencyContacts ?? [];
    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      emergencyContacts: [...existingContacts, contactWithGrant],
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    this.notify();

    logger.info(`Emergency contact added: ${contact.name} (${contact.email})`, {
      component: 'AppVaultService',
      contactId,
    });

    return { contact: contactWithGrant, grantJson };
  }

  async deleteEmergencyContact(contactId: string): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const existingContacts = domain.emergencyContacts ?? [];
    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      emergencyContacts: existingContacts.filter((c) => c.id !== contactId),
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    this.notify();

    logger.info(`Emergency contact deleted: ${contactId}`, {
      component: 'AppVaultService',
    });
  }

  async updateEmergencyContactStatus(
    contactId: string,
    status: EmergencyContact['status'],
    requestDate?: string | undefined
  ): Promise<void> {
    const { domain, vaultKey } = this.ensureUnlocked();
    const currentContainer = await this.repository.read();
    if (!currentContainer) {
      throw new VaultNotFoundError();
    }

    const now = new Date().toISOString();
    const existingContacts = domain.emergencyContacts ?? [];
    const nextDomain: DecryptedVaultDomain = {
      ...domain,
      metadata: { ...domain.metadata, updatedAt: now },
      emergencyContacts: existingContacts.map((c): EmergencyContact => {
        if (c.id === contactId) {
          return {
            ...c,
            status,
            requestDate: requestDate !== undefined ? requestDate : c.requestDate,
          };
        }
        return c;
      }),
    };

    const nextContainer = await reencryptVaultPayload(nextDomain, vaultKey, currentContainer);
    await this.repository.replaceAtomically(nextContainer);
    this.inMemoryDomain = nextDomain;
    this.notify();

    logger.info(`Emergency contact status updated: ${contactId} -> ${status}`, {
      component: 'AppVaultService',
    });
  }

  async approveEmergencyRequest(contactId: string): Promise<void> {
    await this.updateEmergencyContactStatus(contactId, 'approved');
  }

  async rejectEmergencyRequest(contactId: string): Promise<void> {
    await this.updateEmergencyContactStatus(contactId, 'revoked');
  }

  async simulateEmergencyRequest(contactId: string, daysAgo: number = 0): Promise<void> {
    const requestDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();
    await this.updateEmergencyContactStatus(contactId, 'requested', requestDate);
  }

  async resetEmergencyRequest(contactId: string): Promise<void> {
    await this.updateEmergencyContactStatus(contactId, 'active', undefined);
  }
}

export const appVaultService = new AppVaultService();
