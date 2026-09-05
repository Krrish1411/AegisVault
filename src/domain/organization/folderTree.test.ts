import { describe, it, expect } from 'vitest';
import {
  buildFolderTree,
  getDescendantFolderIds,
  validateFolderMove,
} from './folderTree';
import type { VaultFolder, VaultItemEnvelope } from '@/domain/vault/types';

describe('folderTree Hierarchy Engine', () => {
  const folders: VaultFolder[] = [
    { id: 'f-work', name: 'Work', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'f-clients', name: 'Clients', parentId: 'f-work', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'f-acme', name: 'Acme Corp', parentId: 'f-clients', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'f-personal', name: 'Personal', createdAt: '2026-01-01T00:00:00Z' },
  ];

  const items: Partial<VaultItemEnvelope>[] = [
    { id: 'i-1', folderId: 'f-acme' },
    { id: 'i-2', folderId: 'f-work' },
    { id: 'i-3', folderId: 'f-personal' },
  ];

  it('should build hierarchical folder tree with proper depth and aggregated item counts', () => {
    const tree = buildFolderTree(folders, items as VaultItemEnvelope[]);

    expect(tree.length).toBe(2); // Root nodes: 'Personal', 'Work'
    const workNode = tree.find((n) => n.folder.id === 'f-work');
    expect(workNode).toBeDefined();
    expect(workNode?.depth).toBe(0);
    expect(workNode?.itemCount).toBe(2); // 1 in f-work + 1 in f-acme

    const clientsNode = workNode?.children.find((n) => n.folder.id === 'f-clients');
    expect(clientsNode?.depth).toBe(1);
    expect(clientsNode?.itemCount).toBe(1);

    const acmeNode = clientsNode?.children.find((n) => n.folder.id === 'f-acme');
    expect(acmeNode?.depth).toBe(2);
    expect(acmeNode?.itemCount).toBe(1);
  });

  it('should collect all descendants of a folder', () => {
    const descendants = getDescendantFolderIds(folders, 'f-work');
    expect(descendants).toContain('f-clients');
    expect(descendants).toContain('f-acme');
    expect(descendants).not.toContain('f-personal');
  });

  it('should prevent moving a folder into itself or one of its descendants', () => {
    // Valid moves
    expect(validateFolderMove(folders, 'f-clients', 'f-personal')).toBe(true);
    expect(validateFolderMove(folders, 'f-acme', undefined)).toBe(true);

    // Invalid moves (circular)
    expect(validateFolderMove(folders, 'f-work', 'f-work')).toBe(false);
    expect(validateFolderMove(folders, 'f-work', 'f-clients')).toBe(false);
    expect(validateFolderMove(folders, 'f-work', 'f-acme')).toBe(false);
  });
});
