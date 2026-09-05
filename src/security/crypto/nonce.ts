import { AEAD_NONCE_BYTES } from './aead';
import type { SecureRandomPort } from '@/platform/ports/SecureRandomPort';

/**
 * Generates a fresh random 192-bit nonce for XChaCha20-Poly1305.
 * Under XChaCha20-Poly1305 (24-byte nonce), random nonces generated via CSPRNG have negligible collision probability.
 */
export function generateAeadNonce(random: SecureRandomPort): Uint8Array {
  return random.randomBytes(AEAD_NONCE_BYTES);
}
