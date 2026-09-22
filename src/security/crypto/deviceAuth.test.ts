import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupQuickPin,
  hasQuickPin,
  unwrapWithQuickPin,
  clearQuickPin,
  getQuickPinRemainingAttempts,
} from './deviceAuth';
import { cryptoProvider } from './SodiumCryptoProvider';

describe('deviceAuth Quick PIN Engine', () => {
  beforeEach(() => {
    clearQuickPin();
  });

  it('should configure Quick PIN and unwrap vault key correctly', async () => {
    await cryptoProvider.init();
    const vaultKey = cryptoProvider.randomBytes(32);
    const pin = '987654';

    expect(hasQuickPin()).toBe(false);

    await setupQuickPin(pin, vaultKey);
    expect(hasQuickPin()).toBe(true);
    expect(getQuickPinRemainingAttempts()).toBe(3);

    const unwrapped = await unwrapWithQuickPin(pin);
    expect(unwrapped).toEqual(vaultKey);
    expect(getQuickPinRemainingAttempts()).toBe(3);
  });

  it('should reject incorrect PIN and decrement remaining attempts', async () => {
    await cryptoProvider.init();
    const vaultKey = cryptoProvider.randomBytes(32);
    const pin = '123456';

    await setupQuickPin(pin, vaultKey);

    await expect(unwrapWithQuickPin('000000')).rejects.toThrow('2 attempts remaining');
    expect(getQuickPinRemainingAttempts()).toBe(2);

    await expect(unwrapWithQuickPin('000000')).rejects.toThrow('1 attempt remaining');
    expect(getQuickPinRemainingAttempts()).toBe(1);

    // Third failure triggers lockout and wipes stored record
    await expect(unwrapWithQuickPin('000000')).rejects.toThrow('disabled');
    expect(hasQuickPin()).toBe(false);
  });

  it('should clear Quick PIN when requested', async () => {
    await cryptoProvider.init();
    const vaultKey = cryptoProvider.randomBytes(32);
    await setupQuickPin('5555', vaultKey);
    expect(hasQuickPin()).toBe(true);

    clearQuickPin();
    expect(hasQuickPin()).toBe(false);
  });
});
