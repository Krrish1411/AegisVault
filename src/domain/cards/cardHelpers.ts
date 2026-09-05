export type CardIssuer = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'discover' | 'other';

/**
 * Validates card number using the standard Luhn (mod-10) algorithm.
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Automatically detects the card network/issuer from the Bank Identification Number (BIN).
 */
export function detectCardIssuer(cardNumber: string): CardIssuer {
  const clean = cardNumber.replace(/\D/g, '');
  if (!clean) return 'other';

  if (/^4/.test(clean)) {
    return 'visa';
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return 'mastercard';
  }
  if (/^3[47]/.test(clean)) {
    return 'amex';
  }
  if (/^(6011|64[4-9]|622)/.test(clean)) {
    return 'discover';
  }
  if (/^(60|65|81|82|508)/.test(clean)) {
    return 'rupay';
  }

  return 'other';
}

/**
 * Formats a card number with standard 4-digit grouping.
 */
export function formatCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '').slice(0, 19);
  if (/^3[47]/.test(clean)) {
    // Amex: 4-6-5
    const parts = [clean.slice(0, 4), clean.slice(4, 10), clean.slice(10, 15)].filter(Boolean);
    return parts.join(' ');
  }
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Masks a card number for safe visual display (e.g. •••• •••• •••• 1234).
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Masks a 12-digit Indian Aadhaar number (e.g. •••• •••• 1234).
 */
export function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length < 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Formats Indian PAN card (10 alphanumeric uppercase characters).
 */
export function formatPan(pan: string): string {
  return pan.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
}
