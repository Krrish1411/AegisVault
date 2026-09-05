import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  generatePassphrase,
  generatePin,
  calculatePasswordEntropy,
  classifyPasswordChars,
  getSecureRandomInt,
} from './secretGenerator';

describe('Secret Generator Engine', () => {
  describe('getSecureRandomInt', () => {
    it('should generate numbers within [0, max - 1]', () => {
      for (let i = 0; i < 100; i++) {
        const val = getSecureRandomInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });

    it('should handle max = 1', () => {
      expect(getSecureRandomInt(1)).toBe(0);
    });

    it('should throw for max <= 0', () => {
      expect(() => getSecureRandomInt(0)).toThrow();
      expect(() => getSecureRandomInt(-5)).toThrow();
    });
  });

  describe('generatePassword', () => {
    it('should generate a default 20-character strong password', () => {
      const res = generatePassword();
      expect(res.secret.length).toBe(20);
      expect(res.type).toBe('password');
      expect(res.entropyBits).toBeGreaterThanOrEqual(100);
      expect(['strong', 'very_strong']).toContain(res.strength);
    });

    it('should enforce length bounds between 12 and 128', () => {
      const short = generatePassword({ length: 5 });
      expect(short.secret.length).toBe(12);

      const standard = generatePassword({ length: 32 });
      expect(standard.secret.length).toBe(32);

      const long = generatePassword({ length: 200 });
      expect(long.secret.length).toBe(128);
    });

    it('should respect character set toggles', () => {
      // Digits only
      const digitsOnly = generatePassword({
        length: 16,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
      });
      expect(/^[0-9]+$/.test(digitsOnly.secret)).toBe(true);

      // Uppercase + Lowercase only
      const lettersOnly = generatePassword({
        length: 24,
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(/^[a-zA-Z]+$/.test(lettersOnly.secret)).toBe(true);
    });

    it('should exclude ambiguous characters when requested', () => {
      const ambiguousRegex = /[il1Lo0O|`'"]/i;
      for (let i = 0; i < 20; i++) {
        const res = generatePassword({
          length: 30,
          excludeAmbiguous: true,
        });
        expect(ambiguousRegex.test(res.secret)).toBe(false);
      }
    });

    it('should guarantee minimum characters from each selected set', () => {
      for (let i = 0; i < 20; i++) {
        const res = generatePassword({
          length: 16,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          minUppercase: 2,
          minLowercase: 2,
          minNumbers: 2,
          minSymbols: 2,
        });

        const uppers = (res.secret.match(/[A-Z]/g) || []).length;
        const lowers = (res.secret.match(/[a-z]/g) || []).length;
        const digits = (res.secret.match(/[0-9]/g) || []).length;
        const syms = (res.secret.match(/[^a-zA-Z0-9]/g) || []).length;

        expect(uppers).toBeGreaterThanOrEqual(2);
        expect(lowers).toBeGreaterThanOrEqual(2);
        expect(digits).toBeGreaterThanOrEqual(2);
        expect(syms).toBeGreaterThanOrEqual(2);
      }
    });

    it('should throw if all character sets are disabled', () => {
      expect(() =>
        generatePassword({
          uppercase: false,
          lowercase: false,
          numbers: false,
          symbols: false,
        })
      ).toThrow();
    });
  });

  describe('generatePassphrase', () => {
    it('should generate a 5-word memorable passphrase with high entropy', () => {
      const res = generatePassphrase({ wordCount: 5, separator: '-' });
      const parts = res.secret.split('-');
      expect(parts.length).toBe(5);
      expect(res.type).toBe('passphrase');
      expect(res.entropyBits).toBeGreaterThanOrEqual(50);
    });

    it('should respect custom separators', () => {
      const dotRes = generatePassphrase({ wordCount: 4, separator: '.' });
      expect(dotRes.secret.split('.').length).toBe(4);

      const spaceRes = generatePassphrase({ wordCount: 3, separator: ' ' });
      expect(spaceRes.secret.split(' ').length).toBe(3);
    });

    it('should support uppercase and lowercase formatting', () => {
      const upperRes = generatePassphrase({ wordCount: 3, capitalize: 'all', includeNumber: false });
      const words = upperRes.secret.split('-');
      for (const w of words) {
        expect(w).toBe(w.toUpperCase());
      }

      const lowerRes = generatePassphrase({ wordCount: 3, capitalize: 'none', includeNumber: false });
      const lowerWords = lowerRes.secret.split('-');
      for (const w of lowerWords) {
        expect(w).toBe(w.toLowerCase());
      }
    });

    it('should include a random number when requested', () => {
      const res = generatePassphrase({ wordCount: 4, includeNumber: true });
      expect(/[0-9]/.test(res.secret)).toBe(true);
    });
  });

  describe('generatePin', () => {
    it('should generate a default 6-digit numeric PIN', () => {
      const res = generatePin();
      expect(res.secret.length).toBe(6);
      expect(/^\d{6}$/.test(res.secret)).toBe(true);
      expect(res.type).toBe('pin');
    });

    it('should respect custom PIN length', () => {
      const pin4 = generatePin({ length: 4 });
      expect(pin4.secret.length).toBe(4);
      expect(/^\d{4}$/.test(pin4.secret)).toBe(true);

      const pin8 = generatePin({ length: 8 });
      expect(pin8.secret.length).toBe(8);
      expect(/^\d{8}$/.test(pin8.secret)).toBe(true);
    });
  });

  describe('calculatePasswordEntropy & classifyPasswordChars', () => {
    it('should calculate entropy and classify password strength correctly', () => {
      const weak = calculatePasswordEntropy('password');
      expect(weak.strength).toBe('weak');

      const strong = calculatePasswordEntropy('K9#mX2$vL8!pQ4@z');
      expect(strong.strength).toBe('strong');
      expect(strong.entropyBits).toBeGreaterThan(70);
    });

    it('should classify characters into syntax classes', () => {
      const classified = classifyPasswordChars('Ab1!');
      expect(classified).toEqual([
        { char: 'A', type: 'uppercase' },
        { char: 'b', type: 'lowercase' },
        { char: '1', type: 'number' },
        { char: '!', type: 'symbol' },
      ]);
    });
  });
});
