import { describe, it, expect } from 'vitest';
import { createEncryptedVault, unlockEncryptedVault, reencryptVaultPayload } from './vaultCrypto';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';
import { AuthenticationFailedError } from '@/lib/errors/VaultError';

describe('vaultCrypto Operations', () => {
  const mockDomain: DecryptedVaultDomain = {
    metadata: {
      id: 'vault-test-123',
      name: 'Test Personal Vault',
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
        title: 'ProtonMail',
        favorite: true,
        archived: false,
        tags: ['email'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: {
          username: 'alice@proton.me',
          password: 'SuperSecretPassword123!',
          urls: ['https://mail.proton.me'],
        },
      },
    ],
    folders: [],
    attachments: [],
    auditEvents: [],
  };

  it('should create an encrypted container with random 256-bit VEK and Argon2id wrapped key', async () => {
    const { container, vaultKey } = await createEncryptedVault('MyMasterPassword!2026', mockDomain);

    expect(container.formatVersion).toBe(1);
    expect(container.cryptoProfile).toBe('aegis-v1');
    expect(container.kdf.algorithm).toBe('argon2id');
    expect(container.keyWrap.scheme).toBe('xchacha20poly1305-ietf');
    expect(vaultKey.length).toBe(32);

    // Encrypted payload must not contain plaintext password string in raw JSON
    const containerString = JSON.stringify(container);
    expect(containerString).not.toContain('SuperSecretPassword123!');
    expect(containerString).not.toContain('alice@proton.me');
    expect(containerString).not.toContain('ProtonMail');
  });

  it('should unlock and decrypt vault with correct master password', async () => {
    const { container, vaultKey: originalKey } = await createEncryptedVault('MyMasterPassword!2026', mockDomain);

    const { domain, vaultKey } = await unlockEncryptedVault('MyMasterPassword!2026', container);

    expect(vaultKey).toEqual(originalKey);
    expect(domain.metadata.name).toBe('Test Personal Vault');
    expect(domain.items.length).toBe(1);
    expect(domain.items[0]?.title).toBe('ProtonMail');
    expect((domain.items[0]?.payload as Record<string, string>)['password']).toBe('SuperSecretPassword123!');
  });

  it('should fail with AuthenticationFailedError when master password is wrong', async () => {
    const { container } = await createEncryptedVault('CorrectPassword', mockDomain);

    await expect(unlockEncryptedVault('WrongPassword', container)).rejects.toThrow(AuthenticationFailedError);
  });

  it('should fail with VaultCorruptedError when ciphertext payload is tampered with', async () => {
    const { container } = await createEncryptedVault('CorrectPassword', mockDomain);

    // Tamper with payload ciphertext
    const tamperedContainer = {
      ...container,
      payload: {
        ...container.payload,
        ciphertext: container.payload.ciphertext.slice(0, -4) + 'AAAA',
      },
    };

    await expect(unlockEncryptedVault('CorrectPassword', tamperedContainer)).rejects.toThrow();
  });

  it('should re-encrypt updated domain with existing Vault Key and verify decrypted updates', async () => {
    const { container, vaultKey } = await createEncryptedVault('CorrectPassword', mockDomain);

    const updatedDomain: DecryptedVaultDomain = {
      ...mockDomain,
      items: [
        ...mockDomain.items,
        {
          id: 'item-2',
          type: 'login',
          title: 'GitHub',
          favorite: false,
          archived: false,
          tags: ['developer'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          payload: {
            username: 'octocat',
            password: 'GitHubSecretToken999',
          },
        },
      ],
    };

    const nextContainer = await reencryptVaultPayload(updatedDomain, vaultKey, container);
    const { domain } = await unlockEncryptedVault('CorrectPassword', nextContainer);

    expect(domain.items.length).toBe(2);
    expect(domain.items[1]?.title).toBe('GitHub');
    expect((domain.items[1]?.payload as Record<string, string>)['password']).toBe('GitHubSecretToken999');
  });
});
