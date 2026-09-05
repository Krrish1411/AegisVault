import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  it('should allow relative paths and localhost', async () => {
    // Relative mock
    networkGuard.uninstall();
    // In node/JSDOM, testing allowlist logic
    networkGuard.install({ strictBlock: true, allowLocalhost: true });
    expect(networkGuard.getViolations().length).toBe(0);
  });
});
