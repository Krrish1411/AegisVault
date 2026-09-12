import { describe, it, expect } from 'vitest';
import { exportEncryptedVault, importEncryptedVault } from './vaultExport';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';
import {
  ImportValidationFailedError,
  UnsupportedVaultVersionError,
  VaultCorruptedError,
} from '@/lib/errors/VaultError';

const mockDomain: DecryptedVaultDomain = {
  metadata: {
    id: 'vault-export-test',
    name: 'Export Test Vault',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    formatVersion: 1,
    cryptoProfile: 'aegis-v1',
  },
  settings: DEFAULT_VAULT_SETTINGS,
  items: [
    {
      id: 'export-item-1',
      type: 'login',
      title: 'ProtonMail Secure',
      favorite: true,
      archived: false,
      tags: ['email'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'user@proton.me',
        password: 'SuperSecretProtonPassword#1',
      },
    },
  ],
  folders: [],
  attachments: [],
  auditEvents: [],
};

describe('vaultExport Engine', () => {
  it('should perform a successful export and import round-trip', async () => {
    const backupPassword = 'BackupPassword123!';
    const exportedJson = await exportEncryptedVault(mockDomain, backupPassword);

    expect(exportedJson).toContain('aegisvault-export');

    const importedDomain = await importEncryptedVault(exportedJson, backupPassword);
    expect(importedDomain.metadata.name).toBe('Export Test Vault');
    expect(importedDomain.items.length).toBe(1);
    expect(importedDomain.items[0]?.title).toBe('ProtonMail Secure');
  });

  it('should export and restore bundled encrypted attachment records', async () => {
    const backupPassword = 'BackupPassword123!';
    const mockAttachment = {
      id: 'att-export-1',
      sizeBytes: 1024,
      nonce: 'bm9uY2UxMjM0',
      ciphertext: 'Y2lwaGVydGV4dDEyMzQ=',
      checksumSha256: 'abc123sha256',
      updatedAt: Date.now(),
    };

    const exportedJson = await exportEncryptedVault(
      mockDomain,
      backupPassword,
      undefined,
      [mockAttachment]
    );

    const imported = await importEncryptedVault(exportedJson, backupPassword);
    expect(imported.bundledAttachments).toBeDefined();
    expect(imported.bundledAttachments?.length).toBe(1);
    expect(imported.bundledAttachments?.[0]?.id).toBe('att-export-1');
  });

  it('should reject import with incorrect password', async () => {
    const backupPassword = 'BackupPassword123!';
    const exportedJson = await exportEncryptedVault(mockDomain, backupPassword);

    await expect(
      importEncryptedVault(exportedJson, 'WrongPassword456!')
    ).rejects.toThrow(VaultCorruptedError);
  });

  it('should reject tampered ciphertext with VaultCorruptedError', async () => {
    const backupPassword = 'BackupPassword123!';
    const exportedJson = await exportEncryptedVault(mockDomain, backupPassword);
    const parsed = JSON.parse(exportedJson);

    // Tamper with ciphertext
    const b64 = parsed.ciphertext as string;
    parsed.ciphertext = b64.slice(0, -4) + 'AAAA';
    const tamperedJson = JSON.stringify(parsed);

    await expect(
      importEncryptedVault(tamperedJson, backupPassword)
    ).rejects.toThrow(VaultCorruptedError);
  });

  it('should reject malformed JSON with ImportValidationFailedError', async () => {
    await expect(
      importEncryptedVault('{ corrupted json...', 'password')
    ).rejects.toThrow(ImportValidationFailedError);
  });

  it('should reject newer unsupported version with UnsupportedVaultVersionError', async () => {
    const backupPassword = 'BackupPassword123!';
    const exportedJson = await exportEncryptedVault(mockDomain, backupPassword);
    const parsed = JSON.parse(exportedJson);

    parsed.version = 999;
    const futureJson = JSON.stringify(parsed);

    await expect(
      importEncryptedVault(futureJson, backupPassword)
    ).rejects.toThrow(UnsupportedVaultVersionError);
  });
});
