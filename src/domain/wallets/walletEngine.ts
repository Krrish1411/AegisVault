import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export type SeedWordCount = 12 | 15 | 18 | 21 | 24;

export interface ValidatedSeedPhrase {
  readonly isValid: boolean;
  readonly wordCount: number;
  readonly words: readonly string[];
  readonly error?: string;
}

/**
 * Normalizes a seed phrase into trimmed, lowercase single-spaced words.
 */
export function normalizeSeedPhrase(phrase: string): string {
  return phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join(' ');
}

/**
 * Validates a cryptocurrency seed phrase against standard BIP39 checksum and word counts (12, 15, 18, 21, 24).
 */
export function validateWalletSeedPhrase(phrase: string): ValidatedSeedPhrase {
  const normalized = normalizeSeedPhrase(phrase);
  if (!normalized) {
    return { isValid: false, wordCount: 0, words: [], error: 'Seed phrase cannot be empty' };
  }

  const words = normalized.split(' ');
  const count = words.length;

  if (![12, 15, 18, 21, 24].includes(count)) {
    return {
      isValid: false,
      wordCount: count,
      words,
      error: `Invalid word count (${count}). Standard BIP39 phrases require 12, 15, 18, 21, or 24 words.`,
    };
  }

  const isValid = validateMnemonic(normalized, wordlist);
  if (!isValid) {
    return {
      isValid: false,
      wordCount: count,
      words,
      error: 'Invalid BIP39 checksum or unknown word detected in phrase.',
    };
  }

  return {
    isValid: true,
    wordCount: count,
    words,
  };
}

/**
 * Masks a private key for safe display (e.g. 0x1234••••••••5678).
 */
export function maskPrivateKey(key: string): string {
  const clean = key.trim();
  if (clean.length <= 8) return '••••••••';
  const prefix = clean.slice(0, 6);
  const suffix = clean.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Formats printable emergency recovery card HTML for offline cold storage.
 */
export function generateEmergencyPrintableHtml(input: {
  readonly title: string;
  readonly type: 'wallet_seed' | 'private_key' | 'totp' | 'recovery';
  readonly secretData: string;
  readonly instructions?: string;
  readonly dateCreated: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AegisVault — Emergency Cold Recovery Sheet</title>
  <style>
    body { font-family: monospace; padding: 40px; color: #111; max-width: 650px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    .title { font-size: 18px; font-weight: bold; }
    .warning { border: 2px dashed #d97706; padding: 12px; margin: 15px 0; font-size: 12px; background: #fef3c7; }
    .secret-box { border: 2px solid #111; padding: 16px; margin: 20px 0; background: #fafafa; font-size: 14px; word-break: break-all; }
    .footer { font-size: 11px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">AEGISVAULT — EMERGENCY RECOVERY MATERIAL</div>
    <div>Record: ${input.title} | Type: ${input.type.toUpperCase()}</div>
    <div>Generated: ${input.dateCreated}</div>
  </div>

  <div class="warning">
    <strong>CONFIDENTIAL COLD STORAGE MATERIAL:</strong> Store in a fireproof safe. Do not photograph, email, or upload this document.
  </div>

  <div class="secret-box">
    <strong>RECOVERY DATA:</strong><br><br>
    ${input.secretData}
  </div>

  ${input.instructions ? `<div><strong>ADDITIONAL INSTRUCTIONS:</strong><br>${input.instructions}</div>` : ''}

  <div class="footer">
    AegisVault Zero-Knowledge Cryptographic Vault • Generated locally on device with zero cloud transmission.
  </div>
</body>
</html>`;
}
