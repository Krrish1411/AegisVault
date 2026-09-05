import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Normalizes a recovery phrase by trimming excess whitespace and converting to lowercase.
 */
export function normalizeRecoveryPhrase(phrase: string): string {
  return phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join(' ');
}

/**
 * Generates a standard BIP39 24-word recovery phrase (256-bit entropy).
 */
export function generateRecoveryPhrase(): string {
  return generateMnemonic(wordlist, 256);
}

/**
 * Validates a recovery phrase against BIP39 English wordlist and 8-bit checksum.
 */
export function validateRecoveryPhrase(phrase: string): boolean {
  if (!phrase) return false;
  const normalized = normalizeRecoveryPhrase(phrase);
  const words = normalized.split(' ');
  if (words.length !== 24) return false;
  return validateMnemonic(normalized, wordlist);
}

/**
 * Returns the array of 24 words from a recovery phrase.
 */
export function splitRecoveryPhrase(phrase: string): string[] {
  return normalizeRecoveryPhrase(phrase).split(' ');
}

export { wordlist as bip39EnglishWordlist };
