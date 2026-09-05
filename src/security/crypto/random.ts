import type { SecureRandomPort } from '@/platform/ports/SecureRandomPort';

export const CSPRNG_MINIMUM_ENTROPY_BYTES = 32;

export function generateSecureSalt(random: SecureRandomPort, length = 16): Uint8Array {
  return random.randomBytes(length);
}

export function generateVaultKeyMaterial(random: SecureRandomPort): Uint8Array {
  return random.randomBytes(32);
}
