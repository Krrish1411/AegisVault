import { describe, it, expect, beforeAll } from 'vitest';
import { SodiumCryptoProvider } from './SodiumCryptoProvider';

describe('SodiumCryptoProvider', () => {
  const provider = new SodiumCryptoProvider();

  beforeAll(async () => {
    await provider.init();
  });

  it('should generate secure random bytes of specified length', () => {
    const bytes16 = provider.randomBytes(16);
    const bytes32 = provider.randomBytes(32);
    expect(bytes16.length).toBe(16);
    expect(bytes32.length).toBe(32);
    expect(bytes16).not.toEqual(provider.randomBytes(16));
  });

  it('should derive deterministic 32-byte key from password and salt using Argon2id', async () => {
    const salt = provider.randomBytes(16);
    const params = {
      algorithm: 'argon2id' as const,
      memoryCost: 67108864, // 64 MB
      timeCost: 2,
      parallelism: 1,
    };

    const key1 = await provider.deriveKeyFromPassword({
      password: 'correct-master-password',
      salt,
      params,
    });

    const key2 = await provider.deriveKeyFromPassword({
      password: 'correct-master-password',
      salt,
      params,
    });

    const wrongKey = await provider.deriveKeyFromPassword({
      password: 'wrong-master-password',
      salt,
      params,
    });

    expect(key1.length).toBe(32);
    expect(key1).toEqual(key2);
    expect(key1).not.toEqual(wrongKey);
  });

  it('should perform authenticated XChaCha20-Poly1305 encryption and decryption', () => {
    const key = provider.randomBytes(32);
    const plaintext = provider.fromString('Top secret message payload');

    const encrypted = provider.aeadEncrypt({
      plaintext,
      key,
    });

    expect(encrypted.nonce.length).toBe(24);
    expect(encrypted.ciphertext.length).toBeGreaterThan(plaintext.length);

    const decrypted = provider.aeadDecrypt({
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      key,
    });

    expect(provider.toString(decrypted)).toBe('Top secret message payload');
  });

  it('should throw when decrypting with tampered ciphertext (authenticated encryption verification)', () => {
    const key = provider.randomBytes(32);
    const plaintext = provider.fromString('Important secret');

    const encrypted = provider.aeadEncrypt({
      plaintext,
      key,
    });

    // Tamper with a byte
    const tampered = new Uint8Array(encrypted.ciphertext);
    tampered[0] = (tampered[0] ?? 0) ^ 0xff;

    expect(() =>
      provider.aeadDecrypt({
        ciphertext: tampered,
        nonce: encrypted.nonce,
        key,
      })
    ).toThrow();
  });

  it('should throw when decrypting with incorrect key', () => {
    const key = provider.randomBytes(32);
    const wrongKey = provider.randomBytes(32);
    const plaintext = provider.fromString('Important secret');

    const encrypted = provider.aeadEncrypt({
      plaintext,
      key,
    });

    expect(() =>
      provider.aeadDecrypt({
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
        key: wrongKey,
      })
    ).toThrow();
  });
});
