import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('should start with uninitialized status', () => {
    expect(useSessionStore.getState().status).toBe('uninitialized');
    expect(useSessionStore.getState().vaultName).toBeNull();
  });

  it('should unlock session and update vaultName', () => {
    useSessionStore.getState().unlock('My Vault');
    expect(useSessionStore.getState().status).toBe('unlocked');
    expect(useSessionStore.getState().vaultName).toBe('My Vault');
  });

  it('should lock session and retain vaultName metadata', () => {
    useSessionStore.getState().unlock('Work Vault');
    useSessionStore.getState().lock();
    expect(useSessionStore.getState().status).toBe('locked');
    expect(useSessionStore.getState().vaultName).toBe('Work Vault');
  });

  it('should update autoLockMinutes', () => {
    useSessionStore.getState().setAutoLockMinutes(15);
    expect(useSessionStore.getState().autoLockMinutes).toBe(15);
  });

  it('should record activity timestamp', () => {
    const before = Date.now();
    useSessionStore.getState().recordActivity();
    const after = useSessionStore.getState().lastActiveTimestamp;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
