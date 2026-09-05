import type { KdfParams } from './CryptoProvider';

/**
 * Argon2id KDF configuration constants and profile boundaries.
 */
export const KDF_ALGORITHM = 'argon2id';
export const KDF_SALT_BYTES = 16;
export const KDF_KEY_BYTES = 32;

/**
 * Default KDF profile for browser environments balancing security and responsiveness.
 */
export const DEFAULT_KDF_PARAMS: KdfParams = {
  algorithm: 'argon2id',
  memoryCost: 65536, // 64 MB opsLimit/memLimit equivalent
  timeCost: 3,       // iterations
  parallelism: 1,
};
