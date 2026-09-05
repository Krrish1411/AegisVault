import { ValidationError } from '@/lib/errors/VaultError';

export interface BreachCheckResult {
  readonly isBreached: boolean;
  readonly breachCount: number;
  readonly hashPrefix: string;
  readonly checkedAt: string;
}

/**
 * Calculates SHA-1 hash of a string using Web Crypto in browser memory.
 */
export async function calculateSha1Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data as ArrayBufferView);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Privacy-preserving k-Anonymity breach check against Have I Been Pwned API.
 * 
 * CRITICAL PRIVACY GUARANTEES:
 * 1. Password NEVER leaves browser memory.
 * 2. Full SHA-1 hash NEVER leaves browser memory.
 * 3. Only the 5-character hash prefix is sent to the network (k-Anonymity).
 * 4. Fails immediately if userConsentGiven is false.
 */
export async function checkPasswordBreachPwned(
  password: string,
  userConsentGiven: boolean,
  fetchFn: typeof fetch = fetch
): Promise<BreachCheckResult> {
  if (!userConsentGiven) {
    throw new ValidationError(
      'Online breach check requires explicit user consent before initiating network connection.'
    );
  }

  if (!password) {
    return {
      isBreached: false,
      breachCount: 0,
      hashPrefix: '',
      checkedAt: new Date().toISOString(),
    };
  }

  // 1. Compute full SHA-1 hash locally in memory
  const sha1Hex = await calculateSha1Hex(password);
  const prefix = sha1Hex.slice(0, 5);
  const suffix = sha1Hex.slice(5);

  // 2. Query k-anonymity API using 5-character prefix only
  const url = `https://api.pwnedpasswords.com/range/${prefix}`;
  const response = await fetchFn(url, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true', // Prevents response length side-channel leaks
    },
  });

  if (!response.ok) {
    throw new Error(`Breach check service returned status ${response.status}`);
  }

  const responseText = await response.text();
  const lines = responseText.split('\n');

  // 3. Search locally for matching suffix
  for (const line of lines) {
    const [lineSuffix, countStr] = line.trim().split(':');
    if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
      const count = parseInt(countStr || '0', 10);
      return {
        isBreached: true,
        breachCount: count,
        hashPrefix: prefix,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  return {
    isBreached: false,
    breachCount: 0,
    hashPrefix: prefix,
    checkedAt: new Date().toISOString(),
  };
}
