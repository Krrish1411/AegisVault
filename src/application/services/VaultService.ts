import type {
  DecryptedVaultDomain,
  VaultItemEnvelope,
  VaultSettings,
  VaultFolder,
  AttachmentMetadata,
} from '@/domain/vault/types';

export interface CreateVaultInput {
  readonly vaultName: string;
  readonly masterPassword: string;
  readonly recoveryPhrase?: string;
  readonly settings?: Partial<VaultSettings>;
}

export interface UnlockVaultInput {
  readonly masterPassword: string;
}

export interface RecoverVaultInput {
  readonly recoveryPhrase: string;
  readonly newMasterPassword: string;
}

/**
 * High-level application service interface for orchestrating vault workflows.
 */
export interface VaultService {
  isVaultCreated(): Promise<boolean>;
  createVault(input: CreateVaultInput): Promise<{ recoveryPhrase: string }>;
  unlockVault(input: UnlockVaultInput): Promise<void>;
  lockVault(): Promise<void>;
  recoverVault(input: RecoverVaultInput): Promise<void>;
  changeMasterPassword(newMasterPassword: string): Promise<void>;
  exportVault(backupPassword: string): Promise<string>;
  importVault(backupJson: string, backupPassword: string, mode?: 'replace' | 'merge'): Promise<void>;
  getDecryptedVault(): DecryptedVaultDomain | null;
  saveItem(item: VaultItemEnvelope): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
  toggleFavoriteItem(itemId: string): Promise<void>;
  toggleArchiveItem(itemId: string): Promise<void>;
  createFolder(name: string, parentId?: string): Promise<VaultFolder>;
  updateFolder(folderId: string, updates: Partial<VaultFolder>): Promise<VaultFolder>;
  deleteFolder(folderId: string, deleteItemsOption?: 'move_to_root' | 'delete_all'): Promise<void>;
  restorePasswordFromHistory(itemId: string, historyEntryId: string): Promise<void>;
  deletePasswordHistoryEntry(itemId: string, historyEntryId: string): Promise<void>;
  clearPasswordHistory(itemId: string): Promise<void>;
  updateSettings(settings: Partial<VaultSettings>): Promise<void>;
  addAttachment(file: { filename: string; mediaType: string; data: Uint8Array }, itemId?: string): Promise<AttachmentMetadata>;
  getDecryptedAttachment(attachmentId: string): Promise<{ data: Uint8Array; metadata: AttachmentMetadata }>;
  deleteAttachment(attachmentId: string): Promise<void>;
  getAttachmentTotalBytes(): Promise<number>;
}
