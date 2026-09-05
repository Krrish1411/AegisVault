/**
 * Strict Master Password Validation Policy for AegisVault
 * Enforces institutional-grade complexity:
 * - Minimum 12 characters
 * - Uppercase letter (A-Z)
 * - Lowercase letter (a-z)
 * - Number (0-9)
 * - Symbol / Special character
 */

export interface PasswordRequirements {
  readonly minLength: boolean;
  readonly hasUppercase: boolean;
  readonly hasLowercase: boolean;
  readonly hasNumber: boolean;
  readonly hasSymbol: boolean;
}

export interface PasswordValidationResult {
  readonly isValid: boolean;
  readonly score: number; // 0 to 5
  readonly requirements: PasswordRequirements;
  readonly errors: readonly string[];
}

export function validateMasterPassword(password: string): PasswordValidationResult {
  const minLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  const errors: string[] = [];
  if (!minLength) errors.push('Password must be at least 12 characters long');
  if (!hasUppercase) errors.push('Must contain at least one uppercase letter (A-Z)');
  if (!hasLowercase) errors.push('Must contain at least one lowercase letter (a-z)');
  if (!hasNumber) errors.push('Must contain at least one digit (0-9)');
  if (!hasSymbol) errors.push('Must contain at least one special symbol (!@#$%^&*...)');

  const score = [minLength, hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;
  const isValid = score === 5;

  return {
    isValid,
    score,
    requirements: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
    },
    errors,
  };
}
