import { describe, it, expect, beforeEach } from 'vitest';
import { AppVaultService } from './AppVaultService';
import { DexieVaultRepository } from '@/storage/indexeddb/DexieVaultRepository';
import { useSessionStore } from '@/state/sessionStore';
import { inMemorySearchIndex } from '@/domain/organization/searchIndex';
import type { LoginPayload } from '@/domain/vault/types';

describe('AppVaultService Phase 5 (Organization, Search & History)', () => {
  let repository: DexieVaultRepository;
  let service: AppVaultService;

  beforeEach(async () => {
    repository = new DexieVaultRepository();
    await repository.delete();
    service = new AppVaultService(repository);
    useSessionStore.getState().reset();
  });

  it('should support creating nested folders, renaming, and deleting folders (moving items to root)', async () => {
    await service.createVault({
      vaultName: 'Org Vault',
      masterPassword: 'MasterPassword123!',
    });

    const parent = await service.createFolder('Engineering');
    const child = await service.createFolder('DevOps', parent.id);

    const domain = service.getDecryptedVault();
    expect(domain?.folders.length).toBe(2);

    // Save an item in the child folder
    await service.saveItem({
      id: 'item-kube',
      type: 'login',
      title: 'Kubernetes Cluster',
      folderId: child.id,
      favorite: false,
      archived: false,
      tags: ['k8s', 'infra'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'cluster-admin' },
    });

    // Delete parent folder -> descendant child folder is deleted and item moves to root
    await service.deleteFolder(parent.id, 'move_to_root');

    const afterDelete = service.getDecryptedVault();
    expect(afterDelete?.folders.length).toBe(0);
    const item = afterDelete?.items.find((i) => i.id === 'item-kube');
    expect(item?.folderId).toBeUndefined();
  });

  it('should manage password history and restore older passwords', async () => {
    await service.createVault({
      vaultName: 'History Vault',
      masterPassword: 'MasterPassword123!',
    });

    // 1. Create item with password v1
    await service.saveItem({
      id: 'item-pw',
      type: 'login',
      title: 'Streaming Service',
      favorite: false,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'streamer', password: 'PasswordV1!Original' },
      passwordHistory: [
        { id: 'h-1', password: 'PasswordV0!Ancient', archivedAt: '2026-01-01T00:00:00Z' },
      ],
    });

    // 2. Restore historical password v0
    await service.restorePasswordFromHistory('item-pw', 'h-1');

    const updated = service.getDecryptedVault();
    const item = updated?.items.find((i) => i.id === 'item-pw');
    const payload = item?.payload as Partial<LoginPayload>;

    expect(payload.password).toBe('PasswordV0!Ancient');
    // Previous password v1 should now be in history
    expect(item?.passwordHistory?.some((h) => h.password === 'PasswordV1!Original')).toBe(true);

    // 3. Clear history
    await service.clearPasswordHistory('item-pw');
    const cleared = service.getDecryptedVault()?.items.find((i) => i.id === 'item-pw');
    expect(cleared?.passwordHistory?.length).toBe(0);
  });

  it('should toggle item favorite and archive states', async () => {
    await service.createVault({
      vaultName: 'Flags Vault',
      masterPassword: 'MasterPassword123!',
    });

    await service.saveItem({
      id: 'item-flag',
      type: 'login',
      title: 'Flag Item',
      favorite: false,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'test' },
    });

    await service.toggleFavoriteItem('item-flag');
    expect(service.getDecryptedVault()?.items[0]?.favorite).toBe(true);

    await service.toggleArchiveItem('item-flag');
    expect(service.getDecryptedVault()?.items[0]?.archived).toBe(true);
  });

  it('should wipe in-memory search index when vault is locked', async () => {
    await service.createVault({
      vaultName: 'Search Test Vault',
      masterPassword: 'MasterPassword123!',
    });

    await service.saveItem({
      id: 'item-test',
      type: 'login',
      title: 'Confidential Internal Tool',
      favorite: false,
      archived: false,
      tags: ['internal'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: { username: 'internal_user' },
    });

    expect(inMemorySearchIndex.search({ query: 'confidential' }).length).toBe(1);

    // Lock vault
    await service.lockVault();

    // In-memory search index must be completely wiped
    expect(inMemorySearchIndex.search({ query: 'confidential' }).length).toBe(0);
    expect(inMemorySearchIndex.search().length).toBe(0);
  });
});
