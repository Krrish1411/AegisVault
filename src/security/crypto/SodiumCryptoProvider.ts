import sodium from 'libsodium-wrappers-sumo';
import type { CryptoProvider, KdfParams, AeadEncryptionResult } from './CryptoProvider';
import { CryptoOperationFailedError } from '@/lib/errors/VaultError';
import { logger } from '@/lib/logger';

/**
 * Normalizes a byte array to the Uint8Array constructor of the libsodium realm.
 * Prevents realm mismatch issues across JSDOM / Web Workers / Node.
 */
function toSodiumBytes(arr: Uint8Array): Uint8Array {
  const SodiumUint8Array = (sodium.randombytes_buf(0) as unknown as { constructor: new (len: number) => Uint8Array }).constructor;
  const len = arr.length;
  const result = new SodiumUint8Array(len);
  result.set(arr);
  return result;
}

function toOptionalSodiumBytes(arr?: Uint8Array | null): Uint8Array | null {
  if (!arr) return null;
  return toSodiumBytes(arr);
}

export class SodiumCryptoProvider implements CryptoProvider {
  private isReady = false;

  async init(): Promise<void> {
    if (this.isReady) return;
    await sodium.ready;
    this.isReady = true;
    logger.debug('SodiumCryptoProvider initialized successfully', { component: 'SodiumCryptoProvider' });
  }

  private ensureReady(): void {
    if (!this.isReady) {
      throw new CryptoOperationFailedError('SodiumCryptoProvider not initialized. Call init() first.');
    }
  }

  randomBytes(length: number): Uint8Array {
    this.ensureReady();
    return sodium.randombytes_buf(length);
  }

  async deriveKeyFromPassword(input: {
    readonly password: string;
    readonly salt: Uint8Array;
    readonly params: KdfParams;
  }): Promise<Uint8Array> {
    this.ensureReady();
    try {
      const memLimit = input.params.memoryCost;
      const opsLimit = input.params.timeCost;
      const alg = sodium.crypto_pwhash_ALG_ARGON2ID13;
      const salt = toSodiumBytes(input.salt);

      const key = sodium.crypto_pwhash(
        32, // 256-bit key
        input.password,
        salt,
        opsLimit,
        memLimit,
        alg
      );
      return key;
    } catch (err) {
      throw new CryptoOperationFailedError('Password key derivation (Argon2id) failed', err);
    }
  }

  aeadEncrypt(input: {
    readonly plaintext: Uint8Array;
    readonly key: Uint8Array;
    readonly aad?: Uint8Array;
    readonly nonce?: Uint8Array;
  }): AeadEncryptionResult {
    this.ensureReady();
    try {
      const plaintext = toSodiumBytes(input.plaintext);
      const key = toSodiumBytes(input.key);
      const nonce = input.nonce
        ? toSodiumBytes(input.nonce)
        : sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
      const aad = toOptionalSodiumBytes(input.aad);

      const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plaintext,
        aad,
        null,
        nonce,
        key
      );

      return {
        nonce,
        ciphertext,
      };
    } catch (err) {
      throw new CryptoOperationFailedError('XChaCha20-Poly1305 encryption failed', err);
    }
  }

  aeadDecrypt(input: {
    readonly ciphertext: Uint8Array;
    readonly nonce: Uint8Array;
    readonly key: Uint8Array;
    readonly aad?: Uint8Array;
  }): Uint8Array {
    this.ensureReady();
    try {
      const ciphertext = toSodiumBytes(input.ciphertext);
      const nonce = toSodiumBytes(input.nonce);
      const key = toSodiumBytes(input.key);
      const aad = toOptionalSodiumBytes(input.aad);

      const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        ciphertext,
        aad,
        nonce,
        key
      );
      return plaintext;
    } catch (err) {
      throw new CryptoOperationFailedError('XChaCha20-Poly1305 authentication/decryption failed', err);
    }
  }

  deriveSubkey(input: {
    readonly rootKey: Uint8Array;
    readonly context: string;
    readonly length: number;
    readonly subkeyId?: number;
  }): Uint8Array {
    this.ensureReady();
    try {
      const padContext = (input.context + '________').slice(0, 8);
      const subkeyId = input.subkeyId ?? 1;
      const rootKey = toSodiumBytes(input.rootKey);

      return sodium.crypto_kdf_derive_from_key(
        input.length,
        subkeyId,
        padContext,
        rootKey
      );
    } catch (err) {
      throw new CryptoOperationFailedError('Subkey derivation failed', err);
    }
  }

  // Encoding helpers
  toBase64(bytes: Uint8Array): string {
    this.ensureReady();
    return sodium.to_base64(toSodiumBytes(bytes), sodium.base64_variants.ORIGINAL);
  }

  fromBase64(b64: string): Uint8Array {
    this.ensureReady();
    return sodium.from_base64(b64, sodium.base64_variants.ORIGINAL);
  }

  fromString(text: string): Uint8Array {
    this.ensureReady();
    return sodium.from_string(text);
  }

  toString(bytes: Uint8Array): string {
    this.ensureReady();
    return sodium.to_string(toSodiumBytes(bytes));
  }
}

export const cryptoProvider = new SodiumCryptoProvider();
