/**
 * AEAD authenticated encryption constants and parameter types.
 * Concrete libsodium bindings will be attached in Phase 01.
 */
export const AEAD_ALGORITHM = 'XChaCha20-Poly1305-IETF';
export const AEAD_KEY_BYTES = 32;
export const AEAD_NONCE_BYTES = 24;
export const AEAD_TAG_BYTES = 16;

export interface AeadConfig {
  readonly algorithm: typeof AEAD_ALGORITHM;
  readonly keyBytes: typeof AEAD_KEY_BYTES;
  readonly nonceBytes: typeof AEAD_NONCE_BYTES;
}
