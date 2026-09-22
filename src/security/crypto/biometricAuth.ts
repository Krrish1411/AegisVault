import { cryptoProvider } from './SodiumCryptoProvider';
import { AuthenticationFailedError } from '@/lib/errors/VaultError';
import { aegisBiometricClient } from '@/lib/native/biometrics';

const BIOMETRIC_STORAGE_KEY = 'aegisvault_biometric_v1';
const BIOMETRIC_KEY_STORAGE = 'aegisvault_biometric_key_v1';

export interface StoredBiometricRecord {
  readonly nonce: string; // Base64
  readonly wrappedKey: string; // Base64
  readonly createdAt: string;
}

/**
 * Checks if biometric unlock is supported and enrolled on the device.
 */
export async function isBiometricSupportedOnDevice(): Promise<boolean> {
  try {
    const res = await aegisBiometricClient.checkBiometricAvailability();
    return res.available;
  } catch {
    return false;
  }
}

/**
 * Checks if biometric unlock is currently enabled and configured for this vault.
 */
export function hasBiometricUnlock(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const record = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
    const key = localStorage.getItem(BIOMETRIC_KEY_STORAGE);
    return Boolean(record && key);
  } catch {
    return false;
  }
}

/**
 * Sets up pure biometric unlock (Fingerprint / Face ID, zero PIN).
 * Uses hardware-prompted biometric verification before wrapping the vault key.
 */
export async function setupBiometricUnlock(vaultKey: Uint8Array): Promise<void> {
  // First, verify the user's biometrics
  const promptRes = await aegisBiometricClient.promptBiometric({
    title: 'Enable Biometric Unlock',
    subtitle: 'Touch sensor or look at camera to verify your identity',
    negativeButtonText: 'Cancel',
  });

  if (!promptRes.success) {
    throw new AuthenticationFailedError(promptRes.error || 'Biometric verification failed');
  }

  await cryptoProvider.init();

  // Generate a dedicated 256-bit device-local wrapping key
  const deviceKey = cryptoProvider.randomBytes(32);

  const encResult = cryptoProvider.aeadEncrypt({
    plaintext: vaultKey,
    key: deviceKey,
  });

  const record: StoredBiometricRecord = {
    nonce: cryptoProvider.toBase64(encResult.nonce),
    wrappedKey: cryptoProvider.toBase64(encResult.ciphertext),
    createdAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(record));
    localStorage.setItem(BIOMETRIC_KEY_STORAGE, cryptoProvider.toBase64(deviceKey));
  }

  // Zero memory
  cryptoProvider.memzero(deviceKey);
}

/**
 * Unlocks the vault using pure hardware biometrics (Fingerprint / Face ID).
 * Prompts user for biometrics, unwraps the vault key, and zeros ephemeral memory.
 */
export async function unlockWithBiometric(): Promise<Uint8Array> {
  if (typeof localStorage === 'undefined') {
    throw new AuthenticationFailedError('Local storage unavailable');
  }

  const rawRecord = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
  const rawKey = localStorage.getItem(BIOMETRIC_KEY_STORAGE);

  if (!rawRecord || !rawKey) {
    throw new AuthenticationFailedError('Biometric unlock is not enabled on this device');
  }

  // Prompt native biometrics (Fingerprint / Face ID only, no PIN)
  const promptRes = await aegisBiometricClient.promptBiometric({
    title: 'AegisVault Unlock',
    subtitle: 'Verify fingerprint or face to decrypt your vault',
    negativeButtonText: 'Use Master Password',
  });

  if (!promptRes.success) {
    throw new AuthenticationFailedError(promptRes.error || 'Biometric authentication was canceled');
  }

  await cryptoProvider.init();

  const record = JSON.parse(rawRecord) as StoredBiometricRecord;
  const deviceKey = cryptoProvider.fromBase64(rawKey);
  const nonce = cryptoProvider.fromBase64(record.nonce);
  const wrappedKey = cryptoProvider.fromBase64(record.wrappedKey);

  let vaultKey: Uint8Array;
  try {
    vaultKey = cryptoProvider.aeadDecrypt({
      ciphertext: wrappedKey,
      nonce,
      key: deviceKey,
    });
  } catch (err) {
    clearBiometricUnlock();
    throw new AuthenticationFailedError('Failed to unwrap vault key with biometric credentials', err);
  } finally {
    cryptoProvider.memzero(deviceKey);
  }

  return vaultKey;
}

/**
 * Disables and purges biometric unlock credentials from this device.
 */
export function clearBiometricUnlock(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    localStorage.removeItem(BIOMETRIC_KEY_STORAGE);
  }
}
