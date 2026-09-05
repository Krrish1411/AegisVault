import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateAttachmentSize,
  calculateSha256,
  encryptAttachmentBlob,
  decryptAttachmentBlob,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './attachmentEngine';
import { SodiumCryptoProvider } from '@/security/crypto/SodiumCryptoProvider';

describe('attachmentEngine', () => {
  const cryptoProvider = new SodiumCryptoProvider();

  beforeAll(async () => {
    await cryptoProvider.init();
  });

  it('should enforce 50 MB single-file limit and non-empty file rules', () => {
    expect(() => validateAttachmentSize(0)).toThrow(/empty/);
    expect(() => validateAttachmentSize(1024)).not.toThrow();
    expect(() => validateAttachmentSize(MAX_ATTACHMENT_SIZE_BYTES)).not.toThrow();
    expect(() => validateAttachmentSize(MAX_ATTACHMENT_SIZE_BYTES + 1)).toThrow(/exceeds/);
  });

  it('should calculate SHA-256 checksum of raw binary data', async () => {
    const data = new TextEncoder().encode('AegisVault Confidential Document Content');
    const hash = await calculateSha256(data);
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should perform authenticated encryption and decryption of binary file blobs', async () => {
    const vaultKey = cryptoProvider.randomBytes(32);
    const originalContent = new TextEncoder().encode('PRIVATE_PASSPORT_SCAN_DATA_BYTES_12345');

    const encrypted = await encryptAttachmentBlob(originalContent, vaultKey, cryptoProvider);
    expect(encrypted.nonce).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.checksumSha256).toBeDefined();

    const decrypted = await decryptAttachmentBlob(encrypted, vaultKey, cryptoProvider);
    expect(new TextDecoder().decode(decrypted)).toBe('PRIVATE_PASSPORT_SCAN_DATA_BYTES_12345');
  });

  it('should reject tampered or corrupted attachment ciphertexts', async () => {
    const vaultKey = cryptoProvider.randomBytes(32);
    const originalContent = new TextEncoder().encode('SENSITIVE_DATA');

    const encrypted = await encryptAttachmentBlob(originalContent, vaultKey, cryptoProvider);

    // Tamper with ciphertext
    const corruptedRecord = {
      nonce: encrypted.nonce,
      ciphertext: encrypted.ciphertext.slice(0, -4) + 'AAAA',
    };

    await expect(
      decryptAttachmentBlob(corruptedRecord, vaultKey, cryptoProvider)
    ).rejects.toThrow();
  });
});
