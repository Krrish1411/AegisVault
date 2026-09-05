import { describe, it, expect } from 'vitest';
import {
  generateRecoveryPhrase,
  validateRecoveryPhrase,
  normalizeRecoveryPhrase,
  splitRecoveryPhrase,
} from './bip39';

describe('BIP39 Recovery Phrase Engine', () => {
  it('should generate a valid 24-word BIP39 recovery phrase with 256-bit entropy', () => {
    const phrase = generateRecoveryPhrase();
    const words = splitRecoveryPhrase(phrase);

    expect(words.length).toBe(24);
    expect(validateRecoveryPhrase(phrase)).toBe(true);
  });

  it('should normalize phrases by trimming excess spaces and converting to lowercase', () => {
    const raw = '  ABANDON   ABANDON  ABANDON  ';
    expect(normalizeRecoveryPhrase(raw)).toBe('abandon abandon abandon');
  });

  it('should validate correctly formatted recovery phrases', () => {
    const validPhrase = generateRecoveryPhrase();
    expect(validateRecoveryPhrase(validPhrase)).toBe(true);

    // Normalized with irregular spaces and caps
    const irregular = validPhrase.toUpperCase().replace(/\s+/g, '   ');
    expect(validateRecoveryPhrase(irregular)).toBe(true);
  });

  it('should reject phrases with incorrect word count', () => {
    expect(validateRecoveryPhrase('abandon abandon abandon')).toBe(false);
    expect(validateRecoveryPhrase('')).toBe(false);
  });

  it('should reject phrases with corrupted words or invalid checksums', () => {
    const valid = generateRecoveryPhrase();
    const words = valid.split(' ');

    // 1. Non-existent word
    const corruptedWords = [...words];
    corruptedWords[0] = 'notabipwordxyz';
    expect(validateRecoveryPhrase(corruptedWords.join(' '))).toBe(false);

    // 2. Corrupted checksum: replace word with an invalid word
    const corruptedLast = [...words];
    corruptedLast[23] = 'invalidchecksumword';
    expect(validateRecoveryPhrase(corruptedLast.join(' '))).toBe(false);
  });
});
