import type { VaultFolder, VaultItemEnvelope } from '@/domain/vault/types';

export interface FolderNode {
  readonly folder: VaultFolder;
  readonly depth: number;
  readonly itemCount: number;
  readonly children: FolderNode[];
}

/**
 * Recursively builds a structured folder hierarchy tree with depth and item counts.
 */
export function buildFolderTree(
  folders: readonly VaultFolder[],
  items: readonly VaultItemEnvelope[]
): FolderNode[] {
  const itemCountsByFolder = new Map<string, number>();
  for (const item of items) {
    if (item.folderId) {
      const count = itemCountsByFolder.get(item.folderId) ?? 0;
      itemCountsByFolder.set(item.folderId, count + 1);
    }
  }

  const folderMap = new Map<string, VaultFolder>();
  const childrenMap = new Map<string, VaultFolder[]>();

  for (const folder of folders) {
    folderMap.set(folder.id, folder);
    const parentKey = folder.parentId ?? '__ROOT__';
    const list = childrenMap.get(parentKey) ?? [];
    list.push(folder);
    childrenMap.set(parentKey, list);
  }

  function buildNode(folder: VaultFolder, depth: number): FolderNode {
    const rawChildren = childrenMap.get(folder.id) ?? [];
    const sortedChildren = [...rawChildren].sort((a, b) => a.name.localeCompare(b.name));
    const childrenNodes = sortedChildren.map((c) => buildNode(c, depth + 1));

    let totalItems = itemCountsByFolder.get(folder.id) ?? 0;
    for (const child of childrenNodes) {
      totalItems += child.itemCount;
    }

    return {
      folder,
      depth,
      itemCount: totalItems,
      children: childrenNodes,
    };
  }

  const rootFolders = childrenMap.get('__ROOT__') ?? [];
  return rootFolders
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((folder) => buildNode(folder, 0));
}

/**
 * Returns all descendant IDs for a given folder to prevent circular hierarchy loops.
 */
export function getDescendantFolderIds(
  folders: readonly VaultFolder[],
  folderId: string
): string[] {
  const childrenMap = new Map<string, string[]>();
  for (const f of folders) {
    if (f.parentId) {
      const list = childrenMap.get(f.parentId) ?? [];
      list.push(f.id);
      childrenMap.set(f.parentId, list);
    }
  }

  const descendants: string[] = [];
  const queue = [...(childrenMap.get(folderId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.push(current);
    const nextChildren = childrenMap.get(current) ?? [];
    queue.push(...nextChildren);
  }

  return descendants;
}

/**
 * Validates whether a folder can be moved to a new parent without circular dependency corruption.
 */
export function validateFolderMove(
  folders: readonly VaultFolder[],
  movingFolderId: string,
  newParentId?: string
): boolean {
  if (!newParentId) return true; // Moving to root is always valid
  if (movingFolderId === newParentId) return false; // Cannot be own parent

  const descendants = getDescendantFolderIds(folders, movingFolderId);
  if (descendants.includes(newParentId)) {
    return false; // Cannot move folder inside one of its own descendants
  }

  return true;
}
