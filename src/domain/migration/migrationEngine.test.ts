import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateMigrationPreflight,
  executeContainerMigration,
  upgradeVaultKdfParams,
} from './migrationEngine';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import { createEncryptedVault, unlockEncryptedVault } from '@/security/crypto/vaultCrypto';
import type { EncryptedVaultContainer, KdfParams } from '@/security/crypto/types';
import type { DecryptedVaultDomain } from '@/domain/vault/types';

describe('migrationEngine (Vault Durability, Versioning & KDF Upgrades)', () => {
  const crypto = new SodiumCryptoProvider();

  beforeAll(async () => {
    await crypto.init();
  });

  const sampleContainer: EncryptedVaultContainer = {
    formatVersion: 1,
    cryptoProfile: 'argon2id-xchacha20poly1305-v1',
    kdf: {
      algorithm: 'argon2id',
      salt: 'c2FsdHNhbHRzYWx0c2FsdA==',
      memoryCost: 67108864,
      timeCost: 2,
      parallelism: 1,
    },
    keyWrap: {
      scheme: 'xchacha20poly1305-keywrap-v1',
      nonce: 'bm9uY2Vub25jZW5vbmNlbm9uY2U=',
      wrappedVaultKey: 'd3JhcHBlZHZhdWx0a2V5',
    },
    payload: {
      nonce: 'cGF5bG9hZG5vbmNl',
      ciphertext: 'cGF5bG9hZGNpcGhlcnRleHQ=',
    },
  };

  it('should validate preflight for registered migration paths', () => {
    const preflight = validateMigrationPreflight(sampleContainer, 2);
    expect(preflight.canMigrate).toBe(true);
  });

  it('should reject unsupported future versions with explicit error', () => {
    const futureContainer = { ...sampleContainer, formatVersion: 999 };
    const preflight = validateMigrationPreflight(futureContainer, 1);
    expect(preflight.canMigrate).toBe(false);
    expect(preflight.error).toMatch(/Unsupported future vault version/);
  });

  it('should execute registered migration steps sequentially', async () => {
    const result = await executeContainerMigration(sampleContainer, 2);
    expect(result.migratedContainer.formatVersion).toBe(2);
    expect(result.appliedSteps.length).toBe(1);
  });

  it('should upgrade KDF parameters and re-wrap vault key without re-encrypting payload', async () => {
    const masterPassword = 'MasterPassword123!';
    const initialDomain: DecryptedVaultDomain = {
      metadata: {
        id: 'test-vault-1',
        name: 'Migration Test Vault',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formatVersion: 1,
        cryptoProfile: 'argon2id-xchacha20poly1305-v1',
      },
      settings: {
        autoLockMinutes: 5,
        lockOnVisibilityHidden: true,
        clearClipboardSeconds: 30,
        appMode: 'simple',
        theme: 'dark',
        defaultPasswordLength: 20,
      },
      items: [],
      folders: [],
      attachments: [],
      auditEvents: [],
    };

    const { container } = await createEncryptedVault(
      masterPassword,
      initialDomain,
      undefined,
      undefined,
      crypto
    );

    const originalPayloadCiphertext = container.payload.ciphertext;

    const targetParams: KdfParams = {
      algorithm: 'argon2id',
      memoryCost: 134217728, // 128 MB
      timeCost: 3,
      parallelism: 1,
    };

    const upgraded = await upgradeVaultKdfParams(
      container,
      masterPassword,
      targetParams,
      crypto
    );

    expect(upgraded.kdf.memoryCost).toBe(134217728);
    expect(upgraded.kdf.timeCost).toBe(3);
    // Crucial invariant: Payload ciphertext remains intact and untouched
    expect(upgraded.payload.ciphertext).toBe(originalPayloadCiphertext);

    // Verify the upgraded container unlocks successfully with the same master password
    const unlockResult = await unlockEncryptedVault(
      masterPassword,
      upgraded,
      crypto
    );
    expect(unlockResult.domain.metadata.name).toBe('Migration Test Vault');
  });
});
