import { describe, it, expect } from 'vitest';
import {
  createEncryptedVault,
  unlockEncryptedVault,
  unlockEncryptedVaultWithRecovery,
  rewrapVaultKeyWithNewPassword,
} from './vaultCrypto';
import { generateRecoveryPhrase } from './bip39';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';
import { AuthenticationFailedError } from '@/lib/errors/VaultError';

const mockDomain: DecryptedVaultDomain = {
  metadata: {
    id: 'vault-rec-test',
    name: 'Recovery Test Vault',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    formatVersion: 1,
    cryptoProfile: 'aegis-v1',
  },
  settings: DEFAULT_VAULT_SETTINGS,
  items: [
    {
      id: 'item-1',
      type: 'login',
      title: 'Secret Server',
      favorite: true,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        username: 'admin',
        password: 'SuperSecretPassword99!',
      },
    },
  ],
  folders: [],
  attachments: [],
  auditEvents: [],
};

describe('vaultCrypto Recovery & Master Password Rewrapping', () => {
  it('should create vault with recovery wrap and unlock using 24-word recovery phrase', async () => {
    const masterPassword = 'InitialMasterPassword123!';
    const recoveryPhrase = generateRecoveryPhrase();

    const { container, vaultKey } = await createEncryptedVault(
      masterPassword,
      mockDomain,
      recoveryPhrase
    );

    expect(container.recoveryWrap).toBeDefined();
    expect(container.recoveryWrap?.scheme).toBe('xchacha20poly1305-ietf');

    // 1. Recovery unlock
    const { domain: recoveredDomain, vaultKey: recoveredKey } =
      await unlockEncryptedVaultWithRecovery(recoveryPhrase, container);

    expect(recoveredDomain.metadata.name).toBe('Recovery Test Vault');
    expect(recoveredDomain.items[0]?.title).toBe('Secret Server');
    expect(recoveredKey).toEqual(vaultKey);
  });

  it('should reject wrong recovery phrase with AuthenticationFailedError', async () => {
    const masterPassword = 'MasterPassword123!';
    const recoveryPhrase = generateRecoveryPhrase();
    const wrongPhrase = generateRecoveryPhrase();

    const { container } = await createEncryptedVault(
      masterPassword,
      mockDomain,
      recoveryPhrase
    );

    await expect(
      unlockEncryptedVaultWithRecovery(wrongPhrase, container)
    ).rejects.toThrow(AuthenticationFailedError);
  });

  it('should rewrap Vault Key with a new master password and preserve stored data', async () => {
    const oldPassword = 'OldPassword123!';
    const newPassword = 'BrandNewMasterPassword456!';
    const recoveryPhrase = generateRecoveryPhrase();

    const { container, vaultKey } = await createEncryptedVault(
      oldPassword,
      mockDomain,
      recoveryPhrase
    );

    // Re-wrap master password key
    const rewrappedContainer = await rewrapVaultKeyWithNewPassword(
      vaultKey,
      newPassword,
      container
    );

    // Old password must now fail
    await expect(
      unlockEncryptedVault(oldPassword, rewrappedContainer)
    ).rejects.toThrow(AuthenticationFailedError);

    // New password must succeed and decrypt same domain items
    const { domain, vaultKey: unlockedKey } = await unlockEncryptedVault(
      newPassword,
      rewrappedContainer
    );
    expect(domain.items[0]?.title).toBe('Secret Server');
    expect(unlockedKey).toEqual(vaultKey);

    // Recovery phrase must still work
    const { domain: recDomain } = await unlockEncryptedVaultWithRecovery(
      recoveryPhrase,
      rewrappedContainer
    );
    expect(recDomain.items[0]?.title).toBe('Secret Server');
  });
});
