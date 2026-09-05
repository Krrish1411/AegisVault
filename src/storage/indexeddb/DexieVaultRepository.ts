import Dexie, { type Table } from 'dexie';
import type { VaultRepository, EncryptedAttachmentRecord } from '@/storage/ports/VaultRepository';
import type { EncryptedVaultContainer } from '@/security/crypto/types';
import { validateEncryptedContainer } from '@/security/serialization/vaultSerializer';
import { StorageQuotaExceededError, VaultCorruptedError } from '@/lib/errors/VaultError';
import { logger } from '@/lib/logger';

interface VaultDbRecord {
  id: string;
  formatVersion: number;
  containerJson: string;
  updatedAt: number;
}

class AegisDexieDatabase extends Dexie {
  vault!: Table<VaultDbRecord, string>;
  attachments!: Table<EncryptedAttachmentRecord, string>;

  constructor() {
    super('aegisvault_db');
    this.version(2).stores({
      vault: 'id, updatedAt',
      attachments: 'id, sizeBytes, updatedAt',
    });
  }
}

export class DexieVaultRepository implements VaultRepository {
  private db: AegisDexieDatabase;
  private readonly recordId = 'primary_vault';

  constructor(db?: AegisDexieDatabase) {
    this.db = db ?? new AegisDexieDatabase();
  }

  async create(container: EncryptedVaultContainer): Promise<void> {
    const validated = validateEncryptedContainer(container);
    try {
      const record: VaultDbRecord = {
        id: this.recordId,
        formatVersion: validated.formatVersion,
        containerJson: JSON.stringify(validated),
        updatedAt: Date.now(),
      };
      await this.db.vault.put(record);
      logger.debug('Encrypted vault container written to storage', { component: 'DexieVaultRepository' });
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError('IndexedDB quota exceeded', err);
      }
      throw err;
    }
  }

  async read(): Promise<EncryptedVaultContainer | null> {
    try {
      const record = await this.db.vault.get(this.recordId);
      if (!record) return null;

      const parsed = JSON.parse(record.containerJson);
      return validateEncryptedContainer(parsed);
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new VaultCorruptedError('Failed to parse vault record from storage', err);
      }
      throw err;
    }
  }

  async replaceAtomically(next: EncryptedVaultContainer): Promise<void> {
    const validated = validateEncryptedContainer(next);
    try {
      await this.db.transaction('rw', this.db.vault, async () => {
        const record: VaultDbRecord = {
          id: this.recordId,
          formatVersion: validated.formatVersion,
          containerJson: JSON.stringify(validated),
          updatedAt: Date.now(),
        };
        await this.db.vault.put(record);
      });
      logger.debug('Vault replaced atomically in storage', { component: 'DexieVaultRepository' });
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError('IndexedDB quota exceeded on replace', err);
      }
      throw err;
    }
  }

  async delete(): Promise<void> {
    await this.db.transaction('rw', [this.db.vault, this.db.attachments], async () => {
      await this.db.vault.delete(this.recordId);
      await this.db.attachments.clear();
    });
    logger.info('Vault and attachments deleted from storage', { component: 'DexieVaultRepository' });
  }

  async exists(): Promise<boolean> {
    const count = await this.db.vault.where('id').equals(this.recordId).count();
    return count > 0;
  }

  async saveAttachment(record: EncryptedAttachmentRecord): Promise<void> {
    try {
      await this.db.attachments.put(record);
      logger.debug(`Encrypted attachment ${record.id} written to storage (${record.sizeBytes} bytes)`, {
        component: 'DexieVaultRepository',
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError('IndexedDB quota exceeded when saving attachment', err);
      }
      throw err;
    }
  }

  async readAttachment(id: string): Promise<EncryptedAttachmentRecord | null> {
    const record = await this.db.attachments.get(id);
    return record ?? null;
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.db.attachments.delete(id);
    logger.debug(`Attachment ${id} deleted from storage`, { component: 'DexieVaultRepository' });
  }

  async listAttachmentIds(): Promise<string[]> {
    return this.db.attachments.toCollection().primaryKeys();
  }

  async getTotalAttachmentBytes(): Promise<number> {
    const records = await this.db.attachments.toArray();
    return records.reduce((sum, r) => sum + r.sizeBytes, 0);
  }
}

export const dexieVaultRepository = new DexieVaultRepository();
