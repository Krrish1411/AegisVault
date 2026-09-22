import { describe, it, expect, beforeEach } from 'vitest';
import { SqliteVaultRepository } from './SqliteVaultRepository';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import type { EncryptedVaultContainer } from '@/security/crypto/types';

describe('SqliteVaultRepository', () => {
  let fallback: DexieVaultRepository;
  let repo: SqliteVaultRepository;

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
    fallback = new DexieVaultRepository();
    await fallback.delete();
    repo = new SqliteVaultRepository(fallback);
  });

  it('should create and read an encrypted vault container', async () => {
    expect(await repo.exists()).toBe(false);
    expect(await repo.read()).toBeNull();

    await repo.create(sampleContainer);

    expect(await repo.exists()).toBe(true);
    const loaded = await repo.read();
    expect(loaded).not.toBeNull();
    expect(loaded?.formatVersion).toBe(1);
    expect(loaded?.cryptoProfile).toBe('aegis-v1');
    expect(loaded?.payload.ciphertext).toBe('ZW5jcnlwdGVkY2lwaGVydGV4dA==');
  });

  it('should replace vault container atomically', async () => {
    await repo.create(sampleContainer);

    const updatedContainer: EncryptedVaultContainer = {
      ...sampleContainer,
      payload: {
        nonce: 'bmV3bm9uY2U=',
        ciphertext: 'bmV3Y2lwaGVydGV4dA==',
      },
    };

    await repo.replaceAtomically(updatedContainer);
    const loaded = await repo.read();
    expect(loaded?.payload.nonce).toBe('bmV3bm9uY2U=');
    expect(loaded?.payload.ciphertext).toBe('bmV3Y2lwaGVydGV4dA==');
  });

  it('should delete vault container', async () => {
    await repo.create(sampleContainer);
    expect(await repo.exists()).toBe(true);

    await repo.delete();
    expect(await repo.exists()).toBe(false);
    expect(await repo.read()).toBeNull();
  });

  it('should handle encrypted attachment CRUD operations', async () => {
    const attachment = {
      id: 'att-sqlite-1',
      nonce: 'bm9uY2Ux',
      ciphertext: 'Y2lwaGVydGV4dDE=',
      sizeBytes: 1024,
      checksumSha256: 'a'.repeat(64),
      updatedAt: Date.now(),
    };

    await repo.saveAttachment(attachment);

    const readBack = await repo.readAttachment('att-sqlite-1');
    expect(readBack).not.toBeNull();
    expect(readBack?.id).toBe('att-sqlite-1');
    expect(readBack?.sizeBytes).toBe(1024);

    const ids = await repo.listAttachmentIds();
    expect(ids).toContain('att-sqlite-1');

    await repo.deleteAttachment('att-sqlite-1');
    const afterDelete = await repo.readAttachment('att-sqlite-1');
    expect(afterDelete).toBeNull();
  });

  it('should automatically migrate legacy IndexedDB data to SQLite on first read', async () => {
    // Write sample container directly to legacy fallback
    await fallback.create(sampleContainer);

    // Create a new fresh repo instance
    const freshRepo = new SqliteVaultRepository(fallback);

    // Verify it detects and loads the legacy container
    expect(await freshRepo.exists()).toBe(true);
    const loaded = await freshRepo.read();
    expect(loaded?.cryptoProfile).toBe('aegis-v1');
    expect(loaded?.payload.ciphertext).toBe('ZW5jcnlwdGVkY2lwaGVydGV4dA==');
  });
});
