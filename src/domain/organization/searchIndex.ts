import type { DecryptedVaultDomain, VaultItemEnvelope } from '@/domain/vault/types';

export type SortOrder =
  | 'recently_updated'
  | 'oldest_updated'
  | 'title_asc'
  | 'title_desc'
  | 'created_newest'
  | 'created_oldest';

export interface SearchFilterOptions {
  readonly query?: string | undefined;
  readonly folderId?: string | null | undefined; // null for items with no folder (root)
  readonly tag?: string | undefined;
  readonly favoriteOnly?: boolean | undefined;
  readonly archivedOnly?: boolean | undefined;
  readonly itemType?: string | undefined;
  readonly sortOrder?: SortOrder | undefined;
}

export interface IndexedItem {
  readonly item: VaultItemEnvelope;
  readonly searchableText: string;
}

/**
 * In-memory search index for fast client-side query matching.
 * Invariant: Never persisted to disk, localStorage, or IndexedDB.
 * Destroyed upon vault lock.
 */
export class InMemorySearchIndex {
  private indexedItems: IndexedItem[] = [];
  private folderNameMap: Map<string, string> = new Map();

  buildIndex(domain: DecryptedVaultDomain): void {
    this.folderNameMap.clear();
    for (const folder of domain.folders) {
      this.folderNameMap.set(folder.id, folder.name.toLowerCase());
    }

    this.indexedItems = domain.items.map((item) => {
      const folderName = item.folderId ? this.folderNameMap.get(item.folderId) ?? '' : '';

      const payloadStrings = Object.values(item.payload ?? {}).flatMap((v) => {
        if (typeof v === 'string') return [v];
        if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
        return [];
      });

      const tokens: string[] = [
        item.title,
        ...payloadStrings,
        (item.tags ?? []).join(' '),
        folderName,
      ];

      const searchableText = tokens.join(' ').toLowerCase();

      return {
        item,
        searchableText,
      };
    });
  }

  clear(): void {
    this.indexedItems = [];
    this.folderNameMap.clear();
  }

  search(options: SearchFilterOptions = {}): VaultItemEnvelope[] {
    const rawQuery = options.query?.trim().toLowerCase() ?? '';
    const queryTokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    let results = this.indexedItems.filter(({ item, searchableText }) => {
      // 1. Query token matching (all tokens must match)
      if (queryTokens.length > 0) {
        const matchesAll = queryTokens.every((token) => searchableText.includes(token));
        if (!matchesAll) return false;
      }

      // 2. Item Type filter
      if (options.itemType && item.type !== options.itemType) {
        return false;
      }

      // 3. Folder filter
      if (options.folderId !== undefined) {
        if (options.folderId === null) {
          if (item.folderId) return false;
        } else if (item.folderId !== options.folderId) {
          return false;
        }
      }

      // 4. Tag filter
      if (options.tag) {
        const normalizedTag = options.tag.toLowerCase();
        const hasTag = (item.tags ?? []).some((t) => t.toLowerCase() === normalizedTag);
        if (!hasTag) return false;
      }

      // 5. Favorite filter
      if (options.favoriteOnly && !item.favorite) {
        return false;
      }

      // 6. Archive filter (by default hide archived items unless explicitly requested)
      if (options.archivedOnly) {
        if (!item.archived) return false;
      } else if (item.archived) {
        return false;
      }

      return true;
    }).map(({ item }) => item);

    // 7. Sort Order
    const sort = options.sortOrder ?? 'recently_updated';
    results = this.sortItems(results, sort);

    return results;
  }

  private sortItems(items: VaultItemEnvelope[], sort: SortOrder): VaultItemEnvelope[] {
    const sorted = [...items];
    switch (sort) {
      case 'recently_updated':
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'oldest_updated':
        return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case 'title_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'created_newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'created_oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return sorted;
    }
  }
}

export const inMemorySearchIndex = new InMemorySearchIndex();
