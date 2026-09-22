import { describe, it, expect } from 'vitest';
import { generateDuckAlias, isDuckAlias } from './emailAliasGenerator';

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
});
