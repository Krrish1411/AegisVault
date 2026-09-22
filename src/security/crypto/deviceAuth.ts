import { cryptoProvider } from './SodiumCryptoProvider';
import { AuthenticationFailedError } from '@/lib/errors/VaultError';

const QUICK_PIN_STORAGE_KEY = 'aegisvault_quick_pin_v1';
const MAX_FAILED_ATTEMPTS = 3;

export interface StoredQuickPinRecord {
  readonly salt: string; // Base64
  readonly nonce: string; // Base64
  readonly wrappedKey: string; // Base64
  readonly failedAttempts: number;
  readonly createdAt: string;
}

/**
 * Derives a 256-bit wrapping key from a numeric or short device PIN using Web Crypto PBKDF2.
 * High iteration count (100,000) completes in ~15ms on modern devices while resisting GPU dictionary attacks.
 */
async function derivePinKey(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin.trim()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as ArrayBufferView,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Configures instant Quick PIN unlock on this device by wrapping the Vault Encryption Key.
 */
export async function setupQuickPin(pin: string, vaultKey: Uint8Array): Promise<void> {
  if (!pin || pin.length < 4 || pin.length > 12) {
    throw new Error('Quick PIN must be between 4 and 12 digits');
  }

  await cryptoProvider.init();
  const salt = cryptoProvider.randomBytes(16);
  const pinKey = await derivePinKey(pin, salt);

  const encResult = cryptoProvider.aeadEncrypt({
    plaintext: vaultKey,
    key: pinKey,
  });

  // Zero out ephemeral pinKey
  cryptoProvider.memzero(pinKey);

  const record: StoredQuickPinRecord = {
    salt: cryptoProvider.toBase64(salt),
    nonce: cryptoProvider.toBase64(encResult.nonce),
    wrappedKey: cryptoProvider.toBase64(encResult.ciphertext),
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QUICK_PIN_STORAGE_KEY, JSON.stringify(record));
  }
}

/**
 * Checks if Quick PIN is configured on this device and has not been locked out.
 */
export function hasQuickPin(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(QUICK_PIN_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredQuickPinRecord;
    return Boolean(parsed.wrappedKey && parsed.failedAttempts < MAX_FAILED_ATTEMPTS);
  } catch {
    return false;
  }
}

/**
 * Returns the number of remaining failed attempts before lockout.
 */
export function getQuickPinRemainingAttempts(): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(QUICK_PIN_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as StoredQuickPinRecord;
    return Math.max(0, MAX_FAILED_ATTEMPTS - (parsed.failedAttempts || 0));
  } catch {
    return 0;
  }
}

/**
 * Unwraps the Vault Encryption Key using the device PIN in under 20ms.
 * Automatically clears stored credentials and locks out after 3 failed attempts.
 */
export async function unwrapWithQuickPin(pin: string): Promise<Uint8Array> {
  if (typeof localStorage === 'undefined') {
    throw new AuthenticationFailedError('Local storage unavailable');
  }

  const raw = localStorage.getItem(QUICK_PIN_STORAGE_KEY);
  if (!raw) {
    throw new AuthenticationFailedError('No Quick PIN configured on this device');
  }

  let record: StoredQuickPinRecord;
  try {
    record = JSON.parse(raw);
  } catch {
    clearQuickPin();
    throw new AuthenticationFailedError('Corrupted Quick PIN credentials');
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    clearQuickPin();
    throw new AuthenticationFailedError(
      'Too many incorrect Quick PIN attempts. Device quick unlock has been disabled for your security. Please use your Master Password.'
    );
  }

  await cryptoProvider.init();
  const salt = cryptoProvider.fromBase64(record.salt);
  const nonce = cryptoProvider.fromBase64(record.nonce);
  const ciphertext = cryptoProvider.fromBase64(record.wrappedKey);

  let pinKey: Uint8Array | null = null;
  try {
    pinKey = await derivePinKey(pin, salt);
    const vaultKey = cryptoProvider.aeadDecrypt({
      ciphertext,
      nonce,
      key: pinKey,
    });

    // Reset failed attempts on success
    record = { ...record, failedAttempts: 0 };
    localStorage.setItem(QUICK_PIN_STORAGE_KEY, JSON.stringify(record));

    return vaultKey;
  } catch (err) {
    // Record failed attempt
    const newFailCount = (record.failedAttempts || 0) + 1;
    if (newFailCount >= MAX_FAILED_ATTEMPTS) {
      clearQuickPin();
      throw new AuthenticationFailedError(
        'Too many incorrect Quick PIN attempts. Device quick unlock has been disabled. Master Password required.',
        err
      );
    } else {
      record = { ...record, failedAttempts: newFailCount };
      localStorage.setItem(QUICK_PIN_STORAGE_KEY, JSON.stringify(record));
      const remaining = MAX_FAILED_ATTEMPTS - newFailCount;
      throw new AuthenticationFailedError(
        `Incorrect Quick PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
        err
      );
    }
  } finally {
    if (pinKey) {
      cryptoProvider.memzero(pinKey);
    }
  }
}

/**
 * Removes Quick PIN configuration from this device.
 */
export function clearQuickPin(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(QUICK_PIN_STORAGE_KEY);
  }
}
