import { SodiumCryptoProvider, cryptoProvider } from '@/security/crypto/SodiumCryptoProvider';
import type { EncryptedVaultContainer, KdfParams } from '@/security/crypto/types';
import {
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '@/domain/attachments/attachmentEngine';
import {
  UnsupportedVaultVersionError,
  VaultCorruptedError,
  CryptoOperationFailedError,
} from '@/lib/errors/VaultError';

export interface MigrationStep {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
  readonly migrate: (container: EncryptedVaultContainer) => Promise<EncryptedVaultContainer>;
}

/**
 * Registry of format and cryptographic migrations for long-term vault durability.
 */
class MigrationRegistry {
  private steps: Map<number, MigrationStep> = new Map();

  register(step: MigrationStep): void {
    this.steps.set(step.fromVersion, step);
  }

  getStep(fromVersion: number): MigrationStep | undefined {
    return this.steps.get(fromVersion);
  }

  canMigrate(fromVersion: number, targetVersion: number): boolean {
    if (fromVersion === targetVersion) return true;
    let current = fromVersion;
    while (current < targetVersion) {
      const step = this.steps.get(current);
      if (!step) return false;
      current = step.toVersion;
    }
    return current === targetVersion;
  }
}

export const migrationRegistry = new MigrationRegistry();

// Example registered migration step for future versions (e.g. v1 -> v2)
migrationRegistry.register({
  fromVersion: 1,
  toVersion: 2,
  description: 'Add extended partition attributes and audit envelope metadata',
  migrate: async (container: EncryptedVaultContainer) => {
    return {
      ...container,
      formatVersion: 2,
    };
  },
});

/**
 * Preflight validation before executing migration.
 */
export function validateMigrationPreflight(
  container: EncryptedVaultContainer,
  targetVersion: number
): { canMigrate: boolean; error?: string } {
  if (container.formatVersion > targetVersion) {
    return {
      canMigrate: false,
      error: `Unsupported future vault version (v${container.formatVersion}). Please update your app.`,
    };
  }

  if (container.formatVersion === targetVersion) {
    return { canMigrate: true };
  }

  if (!migrationRegistry.canMigrate(container.formatVersion, targetVersion)) {
    return {
      canMigrate: false,
      error: `No migration path found from v${container.formatVersion} to v${targetVersion}.`,
    };
  }

  return { canMigrate: true };
}

/**
 * Executes an atomic migration pipeline from container.formatVersion to targetVersion.
 */
export async function executeContainerMigration(
  container: EncryptedVaultContainer,
  targetVersion: number
): Promise<{ migratedContainer: EncryptedVaultContainer; appliedSteps: string[] }> {
  const preflight = validateMigrationPreflight(container, targetVersion);
  if (!preflight.canMigrate) {
    throw new UnsupportedVaultVersionError(container.formatVersion);
  }

  let currentContainer = container;
  const appliedSteps: string[] = [];

  while (currentContainer.formatVersion < targetVersion) {
    const step = migrationRegistry.getStep(currentContainer.formatVersion);
    if (!step) {
      throw new VaultCorruptedError(
        `Broken migration chain at version ${currentContainer.formatVersion}`
      );
    }

    try {
      currentContainer = await step.migrate(currentContainer);
      appliedSteps.push(step.description);
    } catch (err) {
      throw new CryptoOperationFailedError(
        `Migration failed at step v${step.fromVersion} -> v${step.toVersion}`,
        err
      );
    }
  }

  return {
    migratedContainer: currentContainer,
    appliedSteps,
  };
}

/**
 * Upgrades KDF parameters (e.g. memory cost, iterations) and re-wraps the Vault Encryption Key
 * WITHOUT requiring re-encryption of the vault payload items.
 */
export async function upgradeVaultKdfParams(
  container: EncryptedVaultContainer,
  masterPassword: string,
  newParams: KdfParams,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<EncryptedVaultContainer> {
  await crypto.init();

  // 1. Unwrap current Vault Key with old KDF
  const oldSalt = base64ToUint8Array(container.kdf.salt);
  const oldDerivedKey = await crypto.deriveKeyFromPassword({
    password: masterPassword,
    salt: oldSalt,
    params: container.kdf,
  });

  const wrappedVaultKeyBytes = base64ToUint8Array(container.keyWrap.wrappedVaultKey);
  const wrapNonceBytes = base64ToUint8Array(container.keyWrap.nonce);

  let vaultKey: Uint8Array;
  try {
    vaultKey = crypto.aeadDecrypt({
      ciphertext: wrappedVaultKeyBytes,
      nonce: wrapNonceBytes,
      key: oldDerivedKey,
    });
  } catch (err) {
    throw new CryptoOperationFailedError('Failed to unwrap vault key during KDF upgrade', err);
  }

  // 2. Generate fresh salt and derive key with new KDF parameters
  const newSalt = crypto.randomBytes(16);
  const newDerivedKey = await crypto.deriveKeyFromPassword({
    password: masterPassword,
    salt: newSalt,
    params: newParams,
  });

  // 3. Re-wrap the exact same Vault Encryption Key with new derived key
  const newWrapNonce = crypto.randomBytes(24);
  const newWrappedResult = crypto.aeadEncrypt({
    plaintext: vaultKey,
    key: newDerivedKey,
    nonce: newWrapNonce,
  });

  // 4. Return updated container with untouched payload ciphertext
  return {
    ...container,
    kdf: {
      algorithm: newParams.algorithm,
      salt: uint8ArrayToBase64(newSalt),
      memoryCost: newParams.memoryCost,
      timeCost: newParams.timeCost,
      parallelism: newParams.parallelism,
    },
    keyWrap: {
      scheme: 'xchacha20poly1305-keywrap-v1',
      nonce: uint8ArrayToBase64(newWrapNonce),
      wrappedVaultKey: uint8ArrayToBase64(newWrappedResult.ciphertext),
    },
  };
}
