import { PASSPHRASE_WORDLIST } from './wordlist';

export interface PasswordGeneratorOptions {
  readonly length?: number; // 12-128, default 20
  readonly uppercase?: boolean;
  readonly lowercase?: boolean;
  readonly numbers?: boolean;
  readonly symbols?: boolean;
  readonly excludeAmbiguous?: boolean; // exclude il1Lo0O|`'
  readonly minUppercase?: number;
  readonly minLowercase?: number;
  readonly minNumbers?: number;
  readonly minSymbols?: number;
}

export interface PassphraseGeneratorOptions {
  readonly wordCount?: number; // 3-12, default 5
  readonly separator?: string; // '-', '.', '_', ' ', default '-'
  readonly capitalize?: 'none' | 'first' | 'all';
  readonly includeNumber?: boolean;
}

export interface PinGeneratorOptions {
  readonly length?: number; // 4-12, default 6
}

export type SecretStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';

export interface GeneratedSecret {
  readonly secret: string;
  readonly entropyBits: number;
  readonly strength: SecretStrength;
  readonly type: 'password' | 'passphrase' | 'pin';
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';
const AMBIGUOUS_CHARS = new Set(['i', 'l', '1', 'L', 'o', '0', 'O', '|', '`', "'", '"', 'I']);

/**
 * Returns a cryptographically secure random integer in [0, max - 1].
 * Uses rejection sampling to eliminate modulo bias.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) throw new Error('Max must be greater than 0');
  if (max === 1) return 0;

  const uint32Max = 0xffffffff;
  const limit = uint32Max - (uint32Max % max);
  const buffer = new Uint32Array(1);

  let rand: number;
  do {
    crypto.getRandomValues(buffer);
    rand = buffer[0]!;
  } while (rand >= limit);

  return rand % max;
}

/**
 * Shuffles an array in place using Fisher-Yates with CSPRNG.
 */
function secureShuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = array[i]!;
    array[i] = array[j]!;
    array[j] = temp;
  }
  return array;
}

function filterAmbiguous(chars: string): string {
  return chars
    .split('')
    .filter((c) => !AMBIGUOUS_CHARS.has(c))
    .join('');
}

/**
 * Calculates entropy bits and assigns a strength rating.
 */
export function evaluateEntropy(entropyBits: number): SecretStrength {
  if (entropyBits < 40) return 'weak';
  if (entropyBits < 60) return 'fair';
  if (entropyBits < 80) return 'good';
  if (entropyBits < 110) return 'strong';
  return 'very_strong';
}

export function calculatePasswordEntropy(password: string): { entropyBits: number; strength: SecretStrength } {
  if (!password) return { entropyBits: 0, strength: 'weak' };

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 26;

  const entropyBits = Math.round(password.length * Math.log2(poolSize));
  return {
    entropyBits,
    strength: evaluateEntropy(entropyBits),
  };
}

/**
 * Generates a high-entropy random password according to the requested rules.
 */
export function generatePassword(options: PasswordGeneratorOptions = {}): GeneratedSecret {
  const length = Math.min(128, Math.max(12, options.length ?? 20));
  const useUpper = options.uppercase ?? true;
  const useLower = options.lowercase ?? true;
  const useNumbers = options.numbers ?? true;
  const useSymbols = options.symbols ?? true;
  const excludeAmbiguous = options.excludeAmbiguous ?? false;

  let upperPool = useUpper ? UPPERCASE_CHARS : '';
  let lowerPool = useLower ? LOWERCASE_CHARS : '';
  let numberPool = useNumbers ? NUMBER_CHARS : '';
  let symbolPool = useSymbols ? SYMBOL_CHARS : '';

  if (excludeAmbiguous) {
    upperPool = filterAmbiguous(upperPool);
    lowerPool = filterAmbiguous(lowerPool);
    numberPool = filterAmbiguous(numberPool);
    symbolPool = filterAmbiguous(symbolPool);
  }

  const combinedPool = upperPool + lowerPool + numberPool + symbolPool;
  if (!combinedPool) {
    throw new Error('At least one character set must be enabled');
  }

  const resultChars: string[] = [];

  // Guarantee minimum required characters
  const minUpper = useUpper ? Math.max(1, options.minUppercase ?? 1) : 0;
  const minLower = useLower ? Math.max(1, options.minLowercase ?? 1) : 0;
  const minNum = useNumbers ? Math.max(1, options.minNumbers ?? 1) : 0;
  const minSym = useSymbols ? Math.max(1, options.minSymbols ?? 1) : 0;

  for (let i = 0; i < minUpper && upperPool; i++) {
    resultChars.push(upperPool[getSecureRandomInt(upperPool.length)]!);
  }
  for (let i = 0; i < minLower && lowerPool; i++) {
    resultChars.push(lowerPool[getSecureRandomInt(lowerPool.length)]!);
  }
  for (let i = 0; i < minNum && numberPool; i++) {
    resultChars.push(numberPool[getSecureRandomInt(numberPool.length)]!);
  }
  for (let i = 0; i < minSym && symbolPool; i++) {
    resultChars.push(symbolPool[getSecureRandomInt(symbolPool.length)]!);
  }

  // Fill remaining length from combined pool
  while (resultChars.length < length) {
    resultChars.push(combinedPool[getSecureRandomInt(combinedPool.length)]!);
  }

  // Truncate if minimums exceeded length, then secure shuffle
  const finalChars = secureShuffle(resultChars.slice(0, length));
  const secret = finalChars.join('');

  const entropyBits = Math.round(length * Math.log2(combinedPool.length));

  return {
    secret,
    entropyBits,
    strength: evaluateEntropy(entropyBits),
    type: 'password',
  };
}

/**
 * Generates a multi-word passphrase with high entropy from the local wordlist.
 */
export function generatePassphrase(options: PassphraseGeneratorOptions = {}): GeneratedSecret {
  const wordCount = Math.min(12, Math.max(3, options.wordCount ?? 5));
  const separator = options.separator ?? '-';
  const capitalize = options.capitalize ?? 'first';
  const includeNumber = options.includeNumber ?? true;

  const chosenWords: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    let word = PASSPHRASE_WORDLIST[getSecureRandomInt(PASSPHRASE_WORDLIST.length)]!;
    if (capitalize === 'first') {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    } else if (capitalize === 'all') {
      word = word.toUpperCase();
    }
    chosenWords.push(word);
  }

  if (includeNumber) {
    const randomDigit = String(getSecureRandomInt(10));
    const insertIdx = getSecureRandomInt(chosenWords.length);
    chosenWords[insertIdx] = `${chosenWords[insertIdx]}${randomDigit}`;
  }

  const secret = chosenWords.join(separator);
  let entropyBits = Math.round(wordCount * Math.log2(PASSPHRASE_WORDLIST.length));
  if (includeNumber) entropyBits += Math.round(Math.log2(10));

  return {
    secret,
    entropyBits,
    strength: evaluateEntropy(entropyBits),
    type: 'passphrase',
  };
}

/**
 * Generates a numeric PIN with CSPRNG.
 */
export function generatePin(options: PinGeneratorOptions = {}): GeneratedSecret {
  const length = Math.min(12, Math.max(4, options.length ?? 6));
  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits.push(String(getSecureRandomInt(10)));
  }

  const secret = digits.join('');
  const entropyBits = Math.round(length * Math.log2(10));

  return {
    secret,
    entropyBits,
    strength: evaluateEntropy(entropyBits),
    type: 'pin',
  };
}

export type CharClass = 'uppercase' | 'lowercase' | 'number' | 'symbol';

export interface ClassifiedChar {
  char: string;
  type: CharClass;
}

/**
 * Classifies each character for color-coded visual rendering in the generator preview.
 */
export function classifyPasswordChars(password: string): ClassifiedChar[] {
  return password.split('').map((char) => {
    if (/[A-Z]/.test(char)) return { char, type: 'uppercase' };
    if (/[a-z]/.test(char)) return { char, type: 'lowercase' };
    if (/[0-9]/.test(char)) return { char, type: 'number' };
    return { char, type: 'symbol' };
  });
}
