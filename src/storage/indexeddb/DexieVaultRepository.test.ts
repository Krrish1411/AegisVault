import { describe, it, expect, beforeEach } from 'vitest';
import { DexieVaultRepository } from './DexieVaultRepository';
import type { EncryptedVaultContainer } from '@/security/crypto/types';

describe('DexieVaultRepository', () => {
  let repository: DexieVaultRepository;

  const sampleContainer: EncryptedVaultContainer = {
    formatVersion: 1,
    cryptoProfile: 'aegis-v1',
    kdf: {
      algorithm: 'argon2id',
      salt: 'c2FsdHNhbHRzYWx0c2FsdA==',
      memoryCost: 67108864,
      timeCost: 2,
      parallelism: 1,
    },
    keyWrap: {
      scheme: 'xchacha20poly1305-ietf',
      nonce: 'bm9uY2Vub25jZW5vbmNlbm9uY2U=',
      wrappedVaultKey: 'd3JhcHBlZHZhdWx0a2V5',
    },
    payload: {
      nonce: 'bm9uY2Vub25jZW5vbmNlbm9uY2U=',
      ciphertext: 'ZW5jcnlwdGVkY2lwaGVydGV4dA==',
    },
  };

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
  });

  it('should report exists as false when no vault is stored', async () => {
    expect(await repository.exists()).toBe(false);
    expect(await repository.read()).toBeNull();
  });

  it('should create and read back an encrypted container', async () => {
    await repository.create(sampleContainer);

    expect(await repository.exists()).toBe(true);
    const stored = await repository.read();
    expect(stored).toEqual(sampleContainer);
  });

  it('should replace container atomically', async () => {
    await repository.create(sampleContainer);

    const updatedContainer: EncryptedVaultContainer = {
      ...sampleContainer,
      payload: {
        nonce: 'bm9uY2Vub25jZW5vbmNlbm9uY2U=',
        ciphertext: 'bmV3Y2lwaGVydGV4dA==',
      },
    };

    await repository.replaceAtomically(updatedContainer);
    const stored = await repository.read();
    expect(stored?.payload.ciphertext).toBe('bmV3Y2lwaGVydGV4dA==');
  });

  it('should delete vault container cleanly', async () => {
    await repository.create(sampleContainer);
    expect(await repository.exists()).toBe(true);

    await repository.delete();
    expect(await repository.exists()).toBe(false);
    expect(await repository.read()).toBeNull();
  });
});
