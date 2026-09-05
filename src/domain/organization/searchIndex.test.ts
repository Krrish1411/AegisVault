import { describe, it, expect, beforeEach } from 'vitest';
import { InMemorySearchIndex } from './searchIndex';
import type { DecryptedVaultDomain } from '@/domain/vault/types';
import { DEFAULT_VAULT_SETTINGS } from '@/domain/vault/types';

function createMockDomain(): DecryptedVaultDomain {
  return {
    metadata: {
      id: 'vault-search-test',
      name: 'Search Test Vault',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      formatVersion: 1,
      cryptoProfile: 'aegis-v1',
    },
    settings: DEFAULT_VAULT_SETTINGS,
    folders: [
      {
        id: 'folder-work',
        name: 'Work Services',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    items: [
      {
        id: 'item-1',
        type: 'login',
        title: 'Google Cloud Platform',
        folderId: 'folder-work',
        favorite: true,
        archived: false,
        tags: ['cloud', 'production'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        payload: {
          username: 'admin@company.com',
          urls: ['https://console.cloud.google.com'],
          notes: 'Contains kubernetes clusters',
        },
      },
      {
        id: 'item-2',
        type: 'login',
        title: 'Personal Netflix',
        favorite: false,
        archived: false,
        tags: ['entertainment'],
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
        payload: {
          username: 'krish@gmail.com',
          urls: ['https://netflix.com'],
        },
      },
      {
        id: 'item-3',
        type: 'login',
        title: 'Old Archived Forum',
        favorite: false,
        archived: true,
        tags: ['legacy'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        payload: {
          username: 'forumuser',
        },
      },
    ],
    attachments: [],
    auditEvents: [],
  };
}

describe('InMemorySearchIndex', () => {
  let index: InMemorySearchIndex;

  beforeEach(() => {
    index = new InMemorySearchIndex();
    index.buildIndex(createMockDomain());
  });

  it('should search across title, username, urls, tags, notes, and folder name', () => {
    expect(index.search({ query: 'google' }).map((i) => i.id)).toEqual(['item-1']);
    expect(index.search({ query: 'krish' }).map((i) => i.id)).toEqual(['item-2']);
    expect(index.search({ query: 'kubernetes' }).map((i) => i.id)).toEqual(['item-1']);
    expect(index.search({ query: 'production' }).map((i) => i.id)).toEqual(['item-1']);
    expect(index.search({ query: 'work services' }).map((i) => i.id)).toEqual(['item-1']);
  });

  it('should support multi-token search queries', () => {
    // "google cloud production" matches item-1
    const results = index.search({ query: 'google production' });
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe('item-1');

    // Unmatched token fails
    expect(index.search({ query: 'google netflix' }).length).toBe(0);
  });

  it('should filter by folder, tag, favorite, and archive correctly', () => {
    expect(index.search({ folderId: 'folder-work' }).map((i) => i.id)).toEqual(['item-1']);
    expect(index.search({ tag: 'entertainment' }).map((i) => i.id)).toEqual(['item-2']);
    expect(index.search({ favoriteOnly: true }).map((i) => i.id)).toEqual(['item-1']);

    // Default excludes archived
    expect(index.search().map((i) => i.id)).not.toContain('item-3');

    // Explicit archivedOnly returns archived items
    expect(index.search({ archivedOnly: true }).map((i) => i.id)).toEqual(['item-3']);
  });

  it('should sort items according to specified sort orders', () => {
    const byTitleAsc = index.search({ sortOrder: 'title_asc' });
    expect(byTitleAsc.map((i) => i.title)).toEqual(['Google Cloud Platform', 'Personal Netflix']);

    const byTitleDesc = index.search({ sortOrder: 'title_desc' });
    expect(byTitleDesc.map((i) => i.title)).toEqual(['Personal Netflix', 'Google Cloud Platform']);
  });

  it('should clear in-memory search index when destroyed on lock', () => {
    index.clear();
    expect(index.search({ query: 'google' })).toEqual([]);
    expect(index.search()).toEqual([]);
  });
});
