import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setupBiometricUnlock,
  unlockWithBiometric,
  hasBiometricUnlock,
  clearBiometricUnlock,
  isBiometricSupportedOnDevice,
} from './biometricAuth';
import { cryptoProvider } from './SodiumCryptoProvider';
import { aegisBiometricClient } from '@/lib/native/biometrics';

describe('biometricAuth Pure Biometrics Engine', () => {
  beforeEach(() => {
    clearBiometricUnlock();
    vi.restoreAllMocks();
  });

  it('should report biometric support availability', async () => {
    const supported = await isBiometricSupportedOnDevice();
    expect(typeof supported).toBe('boolean');
  });

  it('should successfully setup and unlock vault with pure biometrics', async () => {
    await cryptoProvider.init();
    const originalVaultKey = cryptoProvider.randomBytes(32);

    expect(hasBiometricUnlock()).toBe(false);

    vi.spyOn(aegisBiometricClient, 'promptBiometric').mockResolvedValue({ success: true });

    await setupBiometricUnlock(originalVaultKey);
    expect(hasBiometricUnlock()).toBe(true);

    const unwrappedKey = await unlockWithBiometric();
    expect(unwrappedKey).toEqual(originalVaultKey);
  });

  it('should reject unlock if biometric prompt fails or is canceled', async () => {
    await cryptoProvider.init();
    const originalVaultKey = cryptoProvider.randomBytes(32);

    vi.spyOn(aegisBiometricClient, 'promptBiometric')
      .mockResolvedValueOnce({ success: true }) // for setup
      .mockResolvedValueOnce({ success: false, error: 'User canceled biometric prompt' }); // for unlock

    await setupBiometricUnlock(originalVaultKey);
    expect(hasBiometricUnlock()).toBe(true);

    await expect(unlockWithBiometric()).rejects.toThrow('User canceled biometric prompt');
  });

  it('should clear biometric unlock when requested', async () => {
    await cryptoProvider.init();
    const originalVaultKey = cryptoProvider.randomBytes(32);

    vi.spyOn(aegisBiometricClient, 'promptBiometric').mockResolvedValue({ success: true });

    await setupBiometricUnlock(originalVaultKey);
    expect(hasBiometricUnlock()).toBe(true);

    clearBiometricUnlock();
    expect(hasBiometricUnlock()).toBe(false);
  });
});
