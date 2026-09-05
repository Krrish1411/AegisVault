import { describe, it, expect } from 'vitest';
import {
  validateWalletSeedPhrase,
  maskPrivateKey,
  generateEmergencyPrintableHtml,
} from './walletEngine';

describe('walletEngine (Crypto Wallets & Recovery Materials)', () => {
  const VALID_12_WORDS = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const VALID_24_WORDS =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

  it('should validate standard 12 and 24 word BIP39 seed phrases', () => {
    const result12 = validateWalletSeedPhrase(VALID_12_WORDS);
    expect(result12.isValid).toBe(true);
    expect(result12.wordCount).toBe(12);

    const result24 = validateWalletSeedPhrase(VALID_24_WORDS);
    expect(result24.isValid).toBe(true);
    expect(result24.wordCount).toBe(24);
  });

  it('should reject seed phrases with invalid word counts or checksums', () => {
    // 10 words (invalid length)
    const resultShort = validateWalletSeedPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');
    expect(resultShort.isValid).toBe(false);
    expect(resultShort.error).toMatch(/Invalid word count/);

    // Bad checksum (last word incorrect)
    const resultBadChecksum = validateWalletSeedPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');
    expect(resultBadChecksum.isValid).toBe(false);
    expect(resultBadChecksum.error).toMatch(/Invalid BIP39 checksum/);
  });

  it('should mask private keys securely', () => {
    expect(maskPrivateKey('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(
      '0x1234••••••••cdef'
    );
  });

  it('should generate emergency cold recovery printable HTML', () => {
    const html = generateEmergencyPrintableHtml({
      title: 'Ledger Cold Seed',
      type: 'wallet_seed',
      secretData: VALID_12_WORDS,
      dateCreated: '2026-09-02',
    });

    expect(html).toContain('AEGISVAULT — EMERGENCY RECOVERY MATERIAL');
    expect(html).toContain('Ledger Cold Seed');
    expect(html).toContain(VALID_12_WORDS);
  });
});
