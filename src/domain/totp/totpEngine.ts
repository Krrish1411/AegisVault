import { ValidationError } from '@/lib/errors/VaultError';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 RFC 4648 string into raw bytes.
 */
export function decodeBase32(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  if (!clean) {
    throw new ValidationError('Base32 secret cannot be empty');
  }

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean.charAt(i);
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new ValidationError(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export interface TotpOptions {
  readonly timestamp?: number;
  readonly period?: number; // default 30
  readonly digits?: 6 | 8; // default 6
  readonly algorithm?: 'SHA1' | 'SHA256' | 'SHA512'; // default SHA1
}

export interface TotpResult {
  readonly code: string;
  readonly secondsRemaining: number;
  readonly period: number;
  readonly progress: number; // 0 to 1
}

/**
 * Generates an RFC 6238 TOTP code from a base32 secret.
 */
export async function generateTotp(
  secretBase32: string,
  options: TotpOptions = {}
): Promise<TotpResult> {
  const period = options.period ?? 30;
  const digits = options.digits ?? 6;
  const algorithm = options.algorithm ?? 'SHA1';
  const timestamp = options.timestamp ?? Date.now();

  const keyBytes = decodeBase32(secretBase32);

  // Time step count
  const epochSeconds = Math.floor(timestamp / 1000);
  const timeStep = Math.floor(epochSeconds / period);
  const secondsRemaining = period - (epochSeconds % period);
  const progress = secondsRemaining / period;

  // Convert timeStep to 8-byte big-endian Uint8Array counter
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // JavaScript numbers are 53-bit integers, safe for high/low word division
  const high = Math.floor(timeStep / 0x100000000);
  const low = timeStep & 0xffffffff;
  counterView.setUint32(0, high, false);
  counterView.setUint32(4, low, false);
  const counterBytes = new Uint8Array(counterBuffer);

  // Map algorithm name for Web Crypto
  const hashName = algorithm === 'SHA256' ? 'SHA-256' : algorithm === 'SHA512' ? 'SHA-512' : 'SHA-1';

  // Perform HMAC using Web Crypto
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as ArrayBufferView,
    { name: 'HMAC', hash: { name: hashName } },
    false,
    ['sign']
  );

  const hmacSignature = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hmacBytes = new Uint8Array(hmacSignature);

  // Dynamic Truncation (RFC 4226 §5.4)
  const offset = hmacBytes[hmacBytes.length - 1]! & 0x0f;
  const binaryCode =
    ((hmacBytes[offset]! & 0x7f) << 24) |
    ((hmacBytes[offset + 1]! & 0xff) << 16) |
    ((hmacBytes[offset + 2]! & 0xff) << 8) |
    (hmacBytes[offset + 3]! & 0xff);

  const modulus = Math.pow(10, digits);
  const otpNumber = binaryCode % modulus;
  const code = otpNumber.toString().padStart(digits, '0');

  return {
    code,
    secondsRemaining,
    period,
    progress,
  };
}

/**
 * Parses an otpauth://totp URI.
 */
export function parseOtpauthUri(uri: string): {
  secret: string;
  issuer?: string | undefined;
  account?: string | undefined;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512' | undefined;
  digits?: (6 | 8) | undefined;
  period?: number | undefined;
} {
  if (!uri.startsWith('otpauth://')) {
    throw new ValidationError('Invalid TOTP URI: must start with otpauth://');
  }

  const url = new URL(uri);
  const secret = url.searchParams.get('secret');
  if (!secret) {
    throw new ValidationError('Invalid TOTP URI: missing secret query parameter');
  }

  // Label: /totp/Issuer:account or /totp/account
  const pathParts = decodeURIComponent(url.pathname.replace(/^\/+/, '')).split(':');
  let issuerFromPath: string | undefined = undefined;
  let accountFromPath: string | undefined = undefined;

  if (pathParts.length === 2) {
    issuerFromPath = pathParts[0]?.replace(/^totp\//, '');
    accountFromPath = pathParts[1];
  } else if (pathParts.length === 1) {
    accountFromPath = pathParts[0]?.replace(/^totp\//, '');
  }

  const issuer = url.searchParams.get('issuer') || issuerFromPath;
  const digitsParam = url.searchParams.get('digits');
  const digits = digitsParam === '8' ? 8 : 6;
  const periodParam = url.searchParams.get('period');
  const period = periodParam ? parseInt(periodParam, 10) : 30;

  const algoParam = url.searchParams.get('algorithm')?.toUpperCase();
  let algorithm: 'SHA1' | 'SHA256' | 'SHA512' = 'SHA1';
  if (algoParam === 'SHA256' || algoParam === 'SHA-256') algorithm = 'SHA256';
  if (algoParam === 'SHA512' || algoParam === 'SHA-512') algorithm = 'SHA512';

  return {
    secret,
    issuer: issuer || undefined,
    account: accountFromPath || undefined,
    algorithm,
    digits,
    period,
  };
}

/**
 * Formats a TOTP code with standard middle spacing (e.g. 123 456 or 1234 5678).
 */
export function formatTotpCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  if (code.length === 8) {
    return `${code.slice(0, 4)} ${code.slice(4)}`;
  }
  return code;
}
