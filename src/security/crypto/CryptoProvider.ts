/**
 * CryptoProvider interface contract.
 * All cryptographic operations (KDF, AEAD, subkey derivation, CSPRNG) are encapsulated here.
 * Real implementation with libsodium is part of Phase 01.
 */

export interface KdfParams {
  readonly algorithm: 'argon2id';
  readonly memoryCost: number; // memory in KiB
  readonly timeCost: number; // iterations
  readonly parallelism: number;
}

export interface AeadEncryptionResult {
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
}

export interface CryptoProvider {
  /**
   * Generates cryptographically secure random bytes.
   */
  randomBytes(length: number): Uint8Array;

  /**
   * Derives a cryptographic key from a master password using Argon2id.
   */
  deriveKeyFromPassword(input: {
    readonly password: string;
    readonly salt: Uint8Array;
    readonly params: KdfParams;
  }): Promise<Uint8Array>;

  /**
   * Encrypts plaintext using XChaCha20-Poly1305 authenticated encryption.
   */
  aeadEncrypt(input: {
    readonly plaintext: Uint8Array;
    readonly key: Uint8Array;
    readonly aad?: Uint8Array;
    readonly nonce?: Uint8Array;
  }): AeadEncryptionResult;

  /**
   * Decrypts ciphertext using XChaCha20-Poly1305 authenticated encryption.
   */
  aeadDecrypt(input: {
    readonly ciphertext: Uint8Array;
    readonly nonce: Uint8Array;
    readonly key: Uint8Array;
    readonly aad?: Uint8Array;
  }): Uint8Array;

  /**
   * Derives a domain-separated subkey from a root key.
   */
  deriveSubkey(input: {
    readonly rootKey: Uint8Array;
    readonly context: string;
    readonly length: number;
    readonly subkeyId?: number;
  }): Uint8Array;
}
