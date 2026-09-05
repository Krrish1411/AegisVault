import { describe, it, expect } from 'vitest';
import {
  validateLuhn,
  detectCardIssuer,
  formatCardNumber,
  maskCardNumber,
  maskAadhaar,
  formatPan,
} from './cardHelpers';

describe('cardHelpers Engine', () => {
  it('should validate valid card numbers using Luhn algorithm', () => {
    expect(validateLuhn('4532015112830366')).toBe(true);
    expect(validateLuhn('4532 0151 1283 0366')).toBe(true);
    expect(validateLuhn('5500000000000004')).toBe(true);
    expect(validateLuhn('378282246310005')).toBe(true); // Amex
  });

  it('should reject invalid card numbers', () => {
    expect(validateLuhn('4532015112830367')).toBe(false); // bad checksum
    expect(validateLuhn('12345')).toBe(false); // too short
    expect(validateLuhn('')).toBe(false);
  });

  it('should detect card issuers from BIN correctly', () => {
    expect(detectCardIssuer('4111222233334444')).toBe('visa');
    expect(detectCardIssuer('5100111122223333')).toBe('mastercard');
    expect(detectCardIssuer('2221000000000000')).toBe('mastercard');
    expect(detectCardIssuer('340000000000000')).toBe('amex');
    expect(detectCardIssuer('370000000000000')).toBe('amex');
    expect(detectCardIssuer('6080000000000000')).toBe('rupay');
    expect(detectCardIssuer('6521000000000000')).toBe('rupay');
    expect(detectCardIssuer('6011000000000000')).toBe('discover');
    expect(detectCardIssuer('9999000000000000')).toBe('other');
  });

  it('should format card numbers cleanly with 4-digit blocks or Amex structure', () => {
    expect(formatCardNumber('4111222233334444')).toBe('4111 2222 3333 4444');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
  });

  it('should mask card numbers for safe visual presentation', () => {
    expect(maskCardNumber('4111222233334444')).toBe('•••• •••• •••• 4444');
    expect(maskCardNumber('4532 0151 1283 0366')).toBe('•••• •••• •••• 0366');
  });

  it('should mask 12-digit Aadhaar numbers', () => {
    expect(maskAadhaar('123456789012')).toBe('•••• •••• 9012');
  });

  it('should format Indian PAN cards to uppercase alphanumeric', () => {
    expect(formatPan('abcde1234f')).toBe('ABCDE1234F');
    expect(formatPan('abcde-1234-f')).toBe('ABCDE1234F');
  });
});
