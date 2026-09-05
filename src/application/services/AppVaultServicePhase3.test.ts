import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import { validateRecoveryPhrase } from '@/security/crypto/bip39';

describe('AppVaultService Phase 3 (Recovery & Encrypted Import/Export)', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().reset();
  });

  it('should generate valid 24-word BIP39 phrase during vault creation and verify zero plaintext in IndexedDB', async () => {
    const result = await service.createVault({
      vaultName: 'Recovery Test Vault',
      masterPassword: 'MasterPassword123!',
    });

    expect(result.recoveryPhrase).toBeDefined();
    expect(validateRecoveryPhrase(result.recoveryPhrase)).toBe(true);

    // Verify recovery phrase is NOT stored in IndexedDB container
    const stored = await repository.read();
    expect(stored).toBeDefined();
    const storedJson = JSON.stringify(stored);
    const words = result.recoveryPhrase.split(' ');
    for (const w of words) {
      expect(storedJson).not.toContain(`"${w}"`);
    }
  });

  it('should recover locked vault using BIP39 phrase and establish new master password', async () => {
    const { recoveryPhrase } = await service.createVault({
      vaultName: 'Recovery Test Vault',
      masterPassword: 'OriginalPassword123!',
    });

    // Save a secret item
    await service.saveItem({
      id: 'secret-1',
      type: 'login',
      title: 'Banking Portal',
      favorite: true,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'bankuser',
        password: 'OriginalBankPassword#99',
      },
    });

    // Lock vault
    await service.lockVault();
    expect(service.getDecryptedVault()).toBeNull();
    expect(useSessionStore.getState().status).toBe('locked');

    // Recover using recovery phrase and new password
    await service.recoverVault({
      recoveryPhrase,
      newMasterPassword: 'BrandNewMasterPassword456!',
    });

    expect(useSessionStore.getState().status).toBe('unlocked');
    const recovered = service.getDecryptedVault();
    expect(recovered).toBeDefined();
    expect(recovered?.items[0]?.title).toBe('Banking Portal');

    // Lock and verify new master password unlocks
    await service.lockVault();
    await service.unlockVault({
      masterPassword: 'BrandNewMasterPassword456!',
    });
    expect(service.getDecryptedVault()?.items[0]?.title).toBe('Banking Portal');

    // Old password must fail
    await service.lockVault();
    await expect(
      service.unlockVault({ masterPassword: 'OriginalPassword123!' })
    ).rejects.toThrow();
  });

  it('should export encrypted backup and restore/merge without losing active data', async () => {
    await service.createVault({
      vaultName: 'Backup Test Vault',
      masterPassword: 'MasterPassword123!',
    });

    await service.saveItem({
      id: 'item-1',
      type: 'login',
      title: 'Service One',
      favorite: false,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'user1' },
    });

    // Export backup
    const backupJson = await service.exportVault('BackupSecretKey123!');
    expect(backupJson).toContain('aegisvault-export');

    // Add another item to active vault
    await service.saveItem({
      id: 'item-2',
      type: 'login',
      title: 'Service Two',
      favorite: false,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'user2' },
    });

    // Import with merge mode
    await service.importVault(backupJson, 'BackupSecretKey123!', 'merge');
    const activeVault = service.getDecryptedVault();
    expect(activeVault?.items.length).toBe(2);
    expect(activeVault?.items.map((i) => i.title)).toContain('Service One');
    expect(activeVault?.items.map((i) => i.title)).toContain('Service Two');
  });
});
