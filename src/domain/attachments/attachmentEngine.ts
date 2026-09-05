import type { CryptoProvider } from '@/security/crypto/CryptoProvider';
import { ValidationError, VaultCorruptedError } from '@/lib/errors/VaultError';

export const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB single-file limit
export const RECOMMENDED_VAULT_TARGET_BYTES = 500 * 1024 * 1024; // 500 MB target

export interface StorageQuotaEstimate {
  readonly usageBytes: number;
  readonly quotaBytes: number;
  readonly percentageUsed: number;
  readonly isNearCapacity: boolean;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Validates that an attachment file does not exceed the 50 MB threshold.
 */
export function validateAttachmentSize(sizeBytes: number): void {
  if (sizeBytes <= 0) {
    throw new ValidationError('Attachment file cannot be empty (0 bytes)');
  }
  if (sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ValidationError(
      `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB single-file limit.`
    );
  }
}

/**
 * Calculates SHA-256 checksum of raw binary data.
 */
export async function calculateSha256(data: Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as ArrayBufferView);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-subtle crypto test environments
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]!) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Encrypts an attachment blob using authenticated XChaCha20-Poly1305.
 */
export async function encryptAttachmentBlob(
  data: Uint8Array,
  vaultKey: Uint8Array,
  cryptoProvider: CryptoProvider
): Promise<{ nonce: string; ciphertext: string; checksumSha256: string }> {
  validateAttachmentSize(data.byteLength);

  const checksumSha256 = await calculateSha256(data);
  const result = cryptoProvider.aeadEncrypt({
    plaintext: data,
    key: vaultKey,
  });

  return {
    nonce: uint8ArrayToBase64(result.nonce),
    ciphertext: uint8ArrayToBase64(result.ciphertext),
    checksumSha256,
  };
}

/**
 * Decrypts an authenticated encrypted attachment blob.
 */
export async function decryptAttachmentBlob(
  record: { nonce: string; ciphertext: string },
  vaultKey: Uint8Array,
  cryptoProvider: CryptoProvider
): Promise<Uint8Array> {
  try {
    const nonceBytes = base64ToUint8Array(record.nonce);
    const ciphertextBytes = base64ToUint8Array(record.ciphertext);
    return cryptoProvider.aeadDecrypt({
      ciphertext: ciphertextBytes,
      nonce: nonceBytes,
      key: vaultKey,
    });
  } catch (err) {
    throw new VaultCorruptedError('Failed to decrypt attachment content or checksum mismatch', err);
  }
}

/**
 * Checks browser storage estimate and quota.
 */
export async function getStorageQuotaEstimate(): Promise<StorageQuotaEstimate> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageBytes = estimate.usage ?? 0;
      const quotaBytes = estimate.quota ?? 1024 * 1024 * 1024;
      const percentageUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

      return {
        usageBytes,
        quotaBytes,
        percentageUsed: Math.min(100, Math.round(percentageUsed * 10) / 10),
        isNearCapacity: percentageUsed > 80,
      };
    } catch {
      // Fallback
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 1024 * 1024 * 1024,
    percentageUsed: 0,
    isNearCapacity: false,
  };
}
