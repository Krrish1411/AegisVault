import { describe, it, expect } from 'vitest';
import { generateDuckAlias, isDuckAlias, extractAliasesFromVault } from './emailAliasGenerator';

describe('emailAliasGenerator (DuckDuckGo @duck.com)', () => {
  it('should generate valid @duck.com aliases in memorable format by default', () => {
    const alias = generateDuckAlias();
    expect(alias).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{4}@duck\.com$/);
    expect(isDuckAlias(alias)).toBe(true);
  });

  it('should generate service-branded aliases when serviceHint is provided', () => {
    const alias = generateDuckAlias({ serviceHint: 'https://github.com/signup' });
    expect(alias).toMatch(/^github-[a-z0-9]{6}@duck\.com$/);
    expect(isDuckAlias(alias)).toBe(true);
  });

  it('should generate compact aliases when compact style is requested', () => {
    const alias = generateDuckAlias({ style: 'compact' });
    expect(alias).toMatch(/^vlt-[a-z0-9]{8}@duck\.com$/);
    expect(isDuckAlias(alias)).toBe(true);
  });

  it('correctly validates @duck.com addresses with isDuckAlias', () => {
    expect(isDuckAlias('privacy-shield-89f2@duck.com')).toBe(true);
    expect(isDuckAlias('PRIVACY@DUCK.COM')).toBe(true);
    expect(isDuckAlias('user@gmail.com')).toBe(false);
    expect(isDuckAlias('user@duck.org')).toBe(false);
    expect(isDuckAlias('')).toBe(false);
  });

  it('extracts unique @duck.com aliases from vault item envelopes', () => {
    const mockItems = [
      {
        id: 'item-1',
        title: 'GitHub',
        createdAt: '2026-09-01T10:00:00Z',
        payload: { username: 'github-test12@duck.com' },
      },
      {
        id: 'item-2',
        title: 'Netflix',
        createdAt: '2026-09-02T10:00:00Z',
        payload: { email: 'swift-fox-8821@duck.com' },
      },
      {
        id: 'item-3',
        title: 'Archived Site',
        archived: true,
        createdAt: '2026-09-03T10:00:00Z',
        payload: { username: 'archived@duck.com' },
      },
      {
        id: 'item-4',
        title: 'Regular Login',
        createdAt: '2026-09-04T10:00:00Z',
        payload: { username: 'john.doe@gmail.com' },
      },
    ];

    const extracted = extractAliasesFromVault(mockItems);
    expect(extracted).toHaveLength(2);
    expect(extracted[0]?.alias).toBe('github-test12@duck.com');
    expect(extracted[0]?.source).toBe('vault');
    expect(extracted[0]?.title).toBe('GitHub');
    expect(extracted[1]?.alias).toBe('swift-fox-8821@duck.com');
  });
});
