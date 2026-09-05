import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import { AuthenticationFailedError, VaultNotFoundError } from '@/lib/errors/VaultError';
import type { VaultItemEnvelope } from '@/domain/vault/types';

describe('AppVaultService End-to-End Vault Lifecycle', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().lock();
  });

  it('should create a vault, encrypt with Argon2id, and transition session state', async () => {
    expect(await service.isVaultCreated()).toBe(false);

    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'StrongPassword123!',
    });

    expect(await service.isVaultCreated()).toBe(true);
    expect(useSessionStore.getState().status).toBe('unlocked');
    expect(useSessionStore.getState().vaultName).toBe('Alice Secure Vault');

    const decrypted = service.getDecryptedVault();
    expect(decrypted).not.toBeNull();
    expect(decrypted?.metadata.name).toBe('Alice Secure Vault');
    expect(decrypted?.items).toEqual([]);
  });

  it('should lock vault and wipe in-memory keys and decrypted domain', async () => {
    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'StrongPassword123!',
    });

    expect(service.getDecryptedVault()).not.toBeNull();
    expect(useSessionStore.getState().status).toBe('unlocked');

    await service.lockVault();

    expect(service.getDecryptedVault()).toBeNull();
    expect(useSessionStore.getState().status).toBe('locked');
  });

  it('should unlock existing vault with correct password', async () => {
    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'StrongPassword123!',
    });
    await service.lockVault();

    await service.unlockVault({
      masterPassword: 'StrongPassword123!',
    });

    expect(useSessionStore.getState().status).toBe('unlocked');
    expect(service.getDecryptedVault()?.metadata.name).toBe('Alice Secure Vault');
  });

  it('should reject unlock with wrong password', async () => {
    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'StrongPassword123!',
    });
    await service.lockVault();

    await expect(
      service.unlockVault({
        masterPassword: 'IncorrectPassword999',
      })
    ).rejects.toThrow(AuthenticationFailedError);

    expect(useSessionStore.getState().status).toBe('locked');
    expect(service.getDecryptedVault()).toBeNull();
  });

  it('should perform full login item CRUD lifecycle round trip', async () => {
    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'StrongPassword123!',
    });

    const now = new Date().toISOString();
    const loginItem: VaultItemEnvelope = {
      id: 'login-item-1',
      type: 'login',
      title: 'GitHub Developer',
      favorite: true,
      archived: false,
      tags: ['developer', 'code'],
      createdAt: now,
      updatedAt: now,
      payload: {
        username: 'alice_dev',
        password: 'GitHubSecretToken_XYZ_999!',
        urls: ['https://github.com'],
        notes: 'Personal account token with repo scope',
      },
    };

    // 1. Create / Save Item
    await service.saveItem(loginItem);

    let decrypted = service.getDecryptedVault();
    expect(decrypted?.items.length).toBe(1);
    expect(decrypted?.items[0]?.title).toBe('GitHub Developer');

    // 2. Lock & Reload from IndexedDB
    await service.lockVault();
    expect(service.getDecryptedVault()).toBeNull();

    await service.unlockVault({ masterPassword: 'StrongPassword123!' });
    decrypted = service.getDecryptedVault();
    expect(decrypted?.items.length).toBe(1);
    expect(decrypted?.items[0]?.title).toBe('GitHub Developer');
    expect((decrypted?.items[0]?.payload as Record<string, string>)['password']).toBe('GitHubSecretToken_XYZ_999!');

    // 3. Update Item
    const updatedItem: VaultItemEnvelope = {
      ...loginItem,
      title: 'GitHub Enterprise',
      payload: {
        ...loginItem.payload,
        username: 'alice_enterprise',
      },
    };
    await service.saveItem(updatedItem);

    decrypted = service.getDecryptedVault();
    expect(decrypted?.items.length).toBe(1);
    expect(decrypted?.items[0]?.title).toBe('GitHub Enterprise');
    expect((decrypted?.items[0]?.payload as Record<string, string>)['username']).toBe('alice_enterprise');

    // 4. Delete Item
    await service.deleteItem('login-item-1');
    decrypted = service.getDecryptedVault();
    expect(decrypted?.items.length).toBe(0);

    // 5. Verify persistence after deletion
    await service.lockVault();
    await service.unlockVault({ masterPassword: 'StrongPassword123!' });
    expect(service.getDecryptedVault()?.items.length).toBe(0);
  });

  it('should ensure raw IndexedDB persistence has zero plaintext passwords or secrets', async () => {
    await service.createVault({
      vaultName: 'Alice Secure Vault',
      masterPassword: 'MasterPassword123!',
    });

    const now = new Date().toISOString();
    const loginItem: VaultItemEnvelope = {
      id: 'secret-test-item',
      type: 'login',
      title: 'Bank of Aegis',
      favorite: false,
      archived: false,
      tags: ['finance'],
      createdAt: now,
      updatedAt: now,
      payload: {
        username: 'alice_super_bank',
        password: 'TopSecretBankingPIN_987654!',
      },
    };

    await service.saveItem(loginItem);

    // Inspect the actual persisted record in IndexedDB
    const rawContainer = await repository.read();
    expect(rawContainer).not.toBeNull();
    const rawJson = JSON.stringify(rawContainer);

    // Invariant verification: No plaintext passwords or usernames in container
    expect(rawJson).not.toContain('TopSecretBankingPIN_987654!');
    expect(rawJson).not.toContain('alice_super_bank');
    expect(rawJson).not.toContain('Bank of Aegis');
  });

  it('should throw VaultNotFoundError when trying to unlock non-existent vault', async () => {
    await expect(
      service.unlockVault({
        masterPassword: 'MasterPassword123!',
      })
    ).rejects.toThrow(VaultNotFoundError);
  });
});
