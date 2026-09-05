import { SodiumCryptoProvider, cryptoProvider } from './SodiumCryptoProvider';
import type { EncryptedVaultContainer, KdfParams } from './types';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import {
  FORMAT_VERSION,
  CRYPTO_PROFILE,
  validateDecryptedVault,
  validateEncryptedContainer,
  serializeDecryptedVault,
} from '@/security/serialization/vaultSerializer';
import {
  AuthenticationFailedError,
  VaultCorruptedError,
  UnsupportedVaultVersionError,
  CryptoOperationFailedError,
} from '@/lib/errors/VaultError';
import { normalizeRecoveryPhrase, validateRecoveryPhrase, generateRecoveryPhrase } from './bip39';

export interface CreateVaultCryptoResult {
  readonly container: EncryptedVaultContainer;
  readonly vaultKey: Uint8Array;
  readonly recoveryPhrase: string;
}

export const DEFAULT_ARGON2ID_PARAMS: KdfParams = {
  algorithm: 'argon2id',
  memoryCost: 67108864, // 64 MB
  timeCost: 2, // 2 iterations
  parallelism: 1,
};

/**
 * Derives a key from a BIP39 recovery phrase using Argon2id.
 */
async function deriveRecoveryKey(
  recoveryPhrase: string,
  salt: Uint8Array,
  crypto: SodiumCryptoProvider
): Promise<Uint8Array> {
  const normalized = normalizeRecoveryPhrase(recoveryPhrase);
  if (!validateRecoveryPhrase(normalized)) {
    throw new AuthenticationFailedError('Invalid BIP39 recovery phrase checksum or wordlist');
  }

  return await crypto.deriveKeyFromPassword({
    password: normalized,
    salt,
    params: DEFAULT_ARGON2ID_PARAMS,
  });
}

/**
 * Wraps a 256-bit Vault Encryption Key with a BIP39 recovery phrase.
 */
export async function wrapVaultKeyWithRecovery(
  vaultKey: Uint8Array,
  recoveryPhrase: string,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<NonNullable<EncryptedVaultContainer['recoveryWrap']>> {
  await crypto.init();
  const salt = crypto.randomBytes(16);
  const recoveryKey = await deriveRecoveryKey(recoveryPhrase, salt, crypto);

  const wrapResult = crypto.aeadEncrypt({
    plaintext: vaultKey,
    key: recoveryKey,
  });

  return {
    scheme: 'xchacha20poly1305-ietf',
    salt: crypto.toBase64(salt),
    nonce: crypto.toBase64(wrapResult.nonce),
    wrappedVaultKey: crypto.toBase64(wrapResult.ciphertext),
  };
}

/**
 * Unwraps a 256-bit Vault Encryption Key from a recovery wrap structure.
 */
export async function unwrapVaultKeyWithRecovery(
  recoveryWrap: NonNullable<EncryptedVaultContainer['recoveryWrap']>,
  recoveryPhrase: string,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<Uint8Array> {
  await crypto.init();
  const salt = crypto.fromBase64(recoveryWrap.salt);
  const recoveryKey = await deriveRecoveryKey(recoveryPhrase, salt, crypto);

  try {
    const nonce = crypto.fromBase64(recoveryWrap.nonce);
    const ciphertext = crypto.fromBase64(recoveryWrap.wrappedVaultKey);
    return crypto.aeadDecrypt({
      ciphertext,
      nonce,
      key: recoveryKey,
    });
  } catch (err) {
    throw new AuthenticationFailedError('Invalid recovery phrase or corrupted recovery wrapping', err);
  }
}

/**
 * Initializes and encrypts a new vault with a random 256-bit Vault Key wrapped by Master Password and Recovery Key.
 */
export async function createEncryptedVault(
  masterPassword: string,
  initialDomain: DecryptedVaultDomain,
  recoveryPhrase?: string,
  kdfParams = DEFAULT_ARGON2ID_PARAMS,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<CreateVaultCryptoResult> {
  await crypto.init();
  const activeRecoveryPhrase = recoveryPhrase ? recoveryPhrase.trim() : generateRecoveryPhrase();

  // 1. Generate 256-bit random Vault Key (VEK)
  const vaultKey = crypto.randomBytes(32);

  // 2. Generate 16-byte random salt for Argon2id
  const salt = crypto.randomBytes(16);

  // 3. Derive 256-bit Password-Derived Key (PDK)
  const passwordKey = await crypto.deriveKeyFromPassword({
    password: masterPassword,
    salt,
    params: kdfParams,
  });

  // 4. Wrap Vault Key using XChaCha20-Poly1305 with PDK
  const wrappedKeyResult = crypto.aeadEncrypt({
    plaintext: vaultKey,
    key: passwordKey,
  });

  // 5. Wrap Vault Key with BIP39 Recovery Phrase
  const recoveryWrap = await wrapVaultKeyWithRecovery(vaultKey, activeRecoveryPhrase, crypto);

  // 6. Encrypt domain payload using Vault Key
  const serialized = serializeDecryptedVault(initialDomain);
  const payloadBytes = crypto.fromString(serialized);
  const payloadResult = crypto.aeadEncrypt({
    plaintext: payloadBytes,
    key: vaultKey,
  });

  // 7. Build container
  const container: EncryptedVaultContainer = {
    formatVersion: FORMAT_VERSION,
    cryptoProfile: CRYPTO_PROFILE,
    kdf: {
      algorithm: 'argon2id',
      salt: crypto.toBase64(salt),
      memoryCost: kdfParams.memoryCost,
      timeCost: kdfParams.timeCost,
      parallelism: kdfParams.parallelism,
    },
    keyWrap: {
      scheme: 'xchacha20poly1305-ietf',
      nonce: crypto.toBase64(wrappedKeyResult.nonce),
      wrappedVaultKey: crypto.toBase64(wrappedKeyResult.ciphertext),
    },
    payload: {
      nonce: crypto.toBase64(payloadResult.nonce),
      ciphertext: crypto.toBase64(payloadResult.ciphertext),
    },
    recoveryWrap,
  };

  validateEncryptedContainer(container);

  return {
    container,
    vaultKey,
    recoveryPhrase: activeRecoveryPhrase,
  };
}

/**
 * Unlocks and decrypts an encrypted vault container using the master password.
 */
export async function unlockEncryptedVault(
  masterPassword: string,
  rawContainer: unknown,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<{ domain: DecryptedVaultDomain; vaultKey: Uint8Array }> {
  await crypto.init();

  // 1. Validate container structure
  const container = validateEncryptedContainer(rawContainer);

  if (container.formatVersion > FORMAT_VERSION) {
    throw new UnsupportedVaultVersionError(container.formatVersion);
  }

  // 2. Derive Password-Derived Key (PDK) from salt and master password
  const salt = crypto.fromBase64(container.kdf.salt);
  let passwordKey: Uint8Array;
  try {
    passwordKey = await crypto.deriveKeyFromPassword({
      password: masterPassword,
      salt,
      params: container.kdf,
    });
  } catch (err) {
    throw new AuthenticationFailedError('Failed to derive key from password', err);
  }

  // 3. Unwrap Vault Encryption Key (VEK)
  let vaultKey: Uint8Array;
  try {
    const wrapNonce = crypto.fromBase64(container.keyWrap.nonce);
    const wrapCiphertext = crypto.fromBase64(container.keyWrap.wrappedVaultKey);
    vaultKey = crypto.aeadDecrypt({
      ciphertext: wrapCiphertext,
      nonce: wrapNonce,
      key: passwordKey,
    });
  } catch (err) {
    throw new AuthenticationFailedError('Incorrect master password or corrupted key wrapping', err);
  }

  // 4. Decrypt payload using Vault Key
  let decryptedJson: string;
  try {
    const payloadNonce = crypto.fromBase64(container.payload.nonce);
    const payloadCiphertext = crypto.fromBase64(container.payload.ciphertext);
    const decryptedBytes = crypto.aeadDecrypt({
      ciphertext: payloadCiphertext,
      nonce: payloadNonce,
      key: vaultKey,
    });
    decryptedJson = crypto.toString(decryptedBytes);
  } catch (err) {
    throw new VaultCorruptedError('Authenticated payload decryption failed. Vault may have been tampered with.', err);
  }

  // 5. Parse and validate decrypted domain
  const domain = validateDecryptedVault(decryptedJson);

  return {
    domain,
    vaultKey,
  };
}

/**
 * Unlocks and decrypts an encrypted vault container using a BIP39 recovery phrase.
 */
export async function unlockEncryptedVaultWithRecovery(
  recoveryPhrase: string,
  rawContainer: unknown,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<{ domain: DecryptedVaultDomain; vaultKey: Uint8Array }> {
  await crypto.init();

  const container = validateEncryptedContainer(rawContainer);
  if (container.formatVersion > FORMAT_VERSION) {
    throw new UnsupportedVaultVersionError(container.formatVersion);
  }

  if (!container.recoveryWrap) {
    throw new CryptoOperationFailedError('No recovery key wrapping found in this vault container');
  }

  // 1. Unwrap Vault Key using Recovery Key
  const vaultKey = await unwrapVaultKeyWithRecovery(container.recoveryWrap, recoveryPhrase, crypto);

  // 2. Decrypt domain payload using unwrapped Vault Key
  let decryptedJson: string;
  try {
    const payloadNonce = crypto.fromBase64(container.payload.nonce);
    const payloadCiphertext = crypto.fromBase64(container.payload.ciphertext);
    const decryptedBytes = crypto.aeadDecrypt({
      ciphertext: payloadCiphertext,
      nonce: payloadNonce,
      key: vaultKey,
    });
    decryptedJson = crypto.toString(decryptedBytes);
  } catch (err) {
    throw new VaultCorruptedError('Authenticated payload decryption failed during recovery unlock', err);
  }

  const domain = validateDecryptedVault(decryptedJson);

  return {
    domain,
    vaultKey,
  };
}

/**
 * Changes master password by re-wrapping the existing 256-bit Vault Key with a newly derived PDK.
 * Preserves all underlying encrypted items, notes, folders, and recovery wraps.
 */
export async function rewrapVaultKeyWithNewPassword(
  vaultKey: Uint8Array,
  newMasterPassword: string,
  currentContainer: EncryptedVaultContainer,
  kdfParams = DEFAULT_ARGON2ID_PARAMS,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<EncryptedVaultContainer> {
  await crypto.init();

  const newSalt = crypto.randomBytes(16);
  const newPasswordKey = await crypto.deriveKeyFromPassword({
    password: newMasterPassword,
    salt: newSalt,
    params: kdfParams,
  });

  const wrappedKeyResult = crypto.aeadEncrypt({
    plaintext: vaultKey,
    key: newPasswordKey,
  });

  const nextContainer: EncryptedVaultContainer = {
    ...currentContainer,
    kdf: {
      algorithm: 'argon2id',
      salt: crypto.toBase64(newSalt),
      memoryCost: kdfParams.memoryCost,
      timeCost: kdfParams.timeCost,
      parallelism: kdfParams.parallelism,
    },
    keyWrap: {
      scheme: 'xchacha20poly1305-ietf',
      nonce: crypto.toBase64(wrappedKeyResult.nonce),
      wrappedVaultKey: crypto.toBase64(wrappedKeyResult.ciphertext),
    },
  };

  validateEncryptedContainer(nextContainer);
  return nextContainer;
}

/**
 * Re-encrypts an updated domain model with the existing Vault Key, preserving key wrap metadata.
 */
export async function reencryptVaultPayload(
  domain: DecryptedVaultDomain,
  vaultKey: Uint8Array,
  currentContainer: EncryptedVaultContainer,
  crypto: SodiumCryptoProvider = cryptoProvider
): Promise<EncryptedVaultContainer> {
  await crypto.init();

  const serialized = serializeDecryptedVault(domain);
  const payloadBytes = crypto.fromString(serialized);
  const payloadResult = crypto.aeadEncrypt({
    plaintext: payloadBytes,
    key: vaultKey,
  });

  const nextContainer: EncryptedVaultContainer = {
    ...currentContainer,
    formatVersion: FORMAT_VERSION,
    cryptoProfile: CRYPTO_PROFILE,
    payload: {
      nonce: crypto.toBase64(payloadResult.nonce),
      ciphertext: crypto.toBase64(payloadResult.ciphertext),
    },
  };

  validateEncryptedContainer(nextContainer);
  return nextContainer;
}
