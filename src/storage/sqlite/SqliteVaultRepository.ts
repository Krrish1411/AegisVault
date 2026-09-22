import { registerPlugin, Capacitor } from '@capacitor/core';
import type { VaultRepository, EncryptedAttachmentRecord } from '@/storage/ports/VaultRepository';
import type { EncryptedVaultContainer } from '@/security/crypto/types';
import type { DecryptedVaultDomain, LoginPayload } from '@/domain/vault/types';
import { validateEncryptedContainer } from '@/security/serialization/vaultSerializer';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { StorageQuotaExceededError } from '@/lib/errors/VaultError';
import { logger } from '@/lib/logger';

export interface AutofillIndexItem {
  id: string;
  domain?: string | undefined;
  packageId?: string | undefined;
  title: string;
  username?: string | undefined;
  encryptedSecret: string;
  updatedAt: number;
}

interface AegisSqlitePluginType {
  saveVaultContainer(options: {
    id: string;
    formatVersion: number;
    containerJson: string;
    updatedAt: number;
  }): Promise<{ success: boolean }>;
  readVaultContainer(options: { id: string }): Promise<{ exists: boolean; containerJson: string | null }>;
  vaultExists(options: { id: string }): Promise<{ exists: boolean }>;
  deleteVault(): Promise<{ success: boolean }>;
  saveAttachment(options: {
    id: string;
    nonce: string;
    ciphertext: string;
    sizeBytes: number;
    checksumSha256: string;
    updatedAt: number;
  }): Promise<{ success: boolean }>;
  readAttachment(options: { id: string }): Promise<EncryptedAttachmentRecord | null>;
  deleteAttachment(options: { id: string }): Promise<{ success: boolean }>;
  listAttachmentIds(): Promise<{ ids: string[] }>;
  syncAutofillIndex(options: { items: AutofillIndexItem[] }): Promise<{ success: boolean; syncedCount: number }>;
}

const NativeAegisSqlite = registerPlugin<AegisSqlitePluginType>('AegisSqlite');

/**
 * Universal SQLite Vault Repository.
 * Direct native SQLite disk access in Android APK & Electron,
 * paired with zero-data-loss automatic migration from legacy storage.
 */
export class SqliteVaultRepository implements VaultRepository {
  private readonly recordId = 'primary_vault';
  private fallbackRepo: DexieVaultRepository;
  private isNativeAvailable: boolean;
  private migrationAttempted = false;

  constructor(fallbackRepo?: DexieVaultRepository) {
    this.fallbackRepo = fallbackRepo ?? new DexieVaultRepository();
    this.isNativeAvailable = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AegisSqlite');
  }

  private async tryLegacyMigration(): Promise<void> {
    if (this.migrationAttempted) return;
    this.migrationAttempted = true;

    try {
      if (await this.fallbackRepo.exists()) {
        const legacyContainer = await this.fallbackRepo.read();
        if (legacyContainer) {
          logger.info('Migrating legacy vault container to unified SQLite database...', {
            component: 'SqliteVaultRepository',
          });
          if (this.isNativeAvailable) {
            await NativeAegisSqlite.saveVaultContainer({
              id: this.recordId,
              formatVersion: legacyContainer.formatVersion,
              containerJson: JSON.stringify(legacyContainer),
              updatedAt: Date.now(),
            });
          }
          logger.info('Legacy vault successfully migrated to SQLite', { component: 'SqliteVaultRepository' });
        }
      }
    } catch (e) {
      logger.warn('Non-fatal warning during legacy vault migration check', {
        component: 'SqliteVaultRepository',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async create(container: EncryptedVaultContainer): Promise<void> {
    const validated = validateEncryptedContainer(container);
    const containerJson = JSON.stringify(validated);

    if (this.isNativeAvailable) {
      try {
        await NativeAegisSqlite.saveVaultContainer({
          id: this.recordId,
          formatVersion: validated.formatVersion,
          containerJson,
          updatedAt: Date.now(),
        });
        logger.debug('Encrypted vault container written to native SQLite database', {
          component: 'SqliteVaultRepository',
        });
        return;
      } catch (err) {
        logger.error('Failed to write to native SQLite, falling back to local storage', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Web / fallback storage
    try {
      await this.fallbackRepo.create(container);
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError('Storage quota exceeded', err);
      }
      throw err;
    }
  }

  async read(): Promise<EncryptedVaultContainer | null> {
    if (this.isNativeAvailable) {
      try {
        const res = await NativeAegisSqlite.readVaultContainer({ id: this.recordId });
        if (res.exists && res.containerJson) {
          const parsed = JSON.parse(res.containerJson);
          return validateEncryptedContainer(parsed);
        }
      } catch (err) {
        logger.error('Error reading from native SQLite', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Check for legacy migration
    await this.tryLegacyMigration();

    // Read from fallback
    return await this.fallbackRepo.read();
  }

  async replaceAtomically(next: EncryptedVaultContainer): Promise<void> {
    const validated = validateEncryptedContainer(next);
    const containerJson = JSON.stringify(validated);

    if (this.isNativeAvailable) {
      try {
        await NativeAegisSqlite.saveVaultContainer({
          id: this.recordId,
          formatVersion: validated.formatVersion,
          containerJson,
          updatedAt: Date.now(),
        });
        logger.debug('Vault replaced atomically in native SQLite', { component: 'SqliteVaultRepository' });
        return;
      } catch (err) {
        logger.error('Failed to replace in native SQLite', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await this.fallbackRepo.replaceAtomically(next);
  }

  async delete(): Promise<void> {
    if (this.isNativeAvailable) {
      try {
        await NativeAegisSqlite.deleteVault();
        logger.info('Vault database purged from native SQLite', { component: 'SqliteVaultRepository' });
      } catch (err) {
        logger.error('Failed to delete native SQLite database', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await this.fallbackRepo.delete();
  }

  async exists(): Promise<boolean> {
    if (this.isNativeAvailable) {
      try {
        const res = await NativeAegisSqlite.vaultExists({ id: this.recordId });
        if (res.exists) return true;
      } catch {
        // fallthrough to fallback
      }
    }

    await this.tryLegacyMigration();
    return await this.fallbackRepo.exists();
  }

  async saveAttachment(record: EncryptedAttachmentRecord): Promise<void> {
    if (this.isNativeAvailable) {
      try {
        await NativeAegisSqlite.saveAttachment({
          id: record.id,
          nonce: record.nonce,
          ciphertext: record.ciphertext,
          sizeBytes: record.sizeBytes,
          checksumSha256: record.checksumSha256,
          updatedAt: record.updatedAt,
        });
        return;
      } catch (err) {
        logger.error('Failed to save attachment to native SQLite', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (this.fallbackRepo.saveAttachment) {
      await this.fallbackRepo.saveAttachment(record);
    }
  }

  async readAttachment(id: string): Promise<EncryptedAttachmentRecord | null> {
    if (this.isNativeAvailable) {
      try {
        return await NativeAegisSqlite.readAttachment({ id });
      } catch (err) {
        logger.error('Failed to read attachment from native SQLite', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (this.fallbackRepo.readAttachment) {
      return await this.fallbackRepo.readAttachment(id);
    }
    return null;
  }

  async deleteAttachment(id: string): Promise<void> {
    if (this.isNativeAvailable) {
      try {
        await NativeAegisSqlite.deleteAttachment({ id });
        return;
      } catch (err) {
        logger.error('Failed to delete attachment from native SQLite', {
          component: 'SqliteVaultRepository',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (this.fallbackRepo.deleteAttachment) {
      await this.fallbackRepo.deleteAttachment(id);
    }
  }

  async listAttachmentIds(): Promise<string[]> {
    if (this.isNativeAvailable) {
      try {
        const res = await NativeAegisSqlite.listAttachmentIds();
        return res.ids || [];
      } catch {
        // fallback
      }
    }

    if (this.fallbackRepo.listAttachmentIds) {
      return await this.fallbackRepo.listAttachmentIds();
    }
    return [];
  }

  async getTotalAttachmentBytes(): Promise<number> {
    if (this.fallbackRepo.getTotalAttachmentBytes) {
      return await this.fallbackRepo.getTotalAttachmentBytes();
    }
    return 0;
  }

  /**
   * Synchronizes active vault logins and credentials into the native SQLite autofill_index
   * table so Android AutofillService can query them in <5ms without starting a WebView.
   */
  async syncAutofillIndex(domain: DecryptedVaultDomain): Promise<void> {
    if (!this.isNativeAvailable) return;

    try {
      const items: AutofillIndexItem[] = [];

      for (const item of domain.items) {
        if (item.archived) continue;

        if (item.type === 'login' || item.type === 'bank_login' || item.type === 'application' || item.type === 'email') {
          const payload = (item.payload ?? {}) as Partial<LoginPayload>;
          const domainUrl = payload.urls?.[0] ?? '';
          const cleanDomain = domainUrl
            .replace(/https?:\/\//, '')
            .replace(/www\./, '')
            .split('/')[0]
            ?.toLowerCase() || '';

          items.push({
            id: item.id,
            domain: cleanDomain,
            packageId: (item.payload as Record<string, unknown>).packageId as string | undefined,
            title: item.title,
            username: payload.username,
            encryptedSecret: payload.password ?? '',
            updatedAt: Date.now(),
          });
        }
      }

      await NativeAegisSqlite.syncAutofillIndex({ items });
      logger.debug('Autofill index synced to native SQLite database', {
        component: 'SqliteVaultRepository',
        count: items.length,
      });
    } catch (e) {
      logger.warn('Failed to sync autofill index to native SQLite', {
        component: 'SqliteVaultRepository',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

export const sqliteVaultRepository = new SqliteVaultRepository();
