import { describe, it, expect, vi } from 'vitest';
import {
  checkPasswordBreachPwned,
  calculateSha1Hex,
} from './breachChecker';

describe('breachChecker (Privacy-Preserving k-Anonymity HIBP Protocol)', () => {
  it('should calculate SHA-1 hash correctly in memory', async () => {
    // SHA-1 of "password" is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    const hash = await calculateSha1Hex('password');
    expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('should enforce explicit user consent and reject network call if consent is missing', async () => {
    await expect(
      checkPasswordBreachPwned('SuperSecretPassword', false)
    ).rejects.toThrow(/explicit user consent/);
  });

  it('should match breached passwords with k-anonymity mock responses', async () => {
    // "password" -> prefix: 5BAA6, suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `0018A45C4D71:3\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:3849204\nFE45D:1`,
    } as unknown as Response);

    const result = await checkPasswordBreachPwned('password', true, mockFetch);
    expect(result.isBreached).toBe(true);
    expect(result.breachCount).toBe(3849204);
    expect(result.hashPrefix).toBe('5BAA6');

    // Verify only the 5-character prefix was sent in the URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pwnedpasswords.com/range/5BAA6',
      expect.anything()
    );
  });

  it('should report safe passwords when hash suffix is not found in range', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `0018A45C4D71:3\nAAAAABBBBBCCCCCDDDDDEEEEEFFFFF:10`,
    } as unknown as Response);

    const result = await checkPasswordBreachPwned('VeryUniquePassword_9999_AegisVault!', true, mockFetch);
    expect(result.isBreached).toBe(false);
    expect(result.breachCount).toBe(0);
  });
});
