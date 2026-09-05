/**
 * Base class for all AegisVault domain and application errors.
 * Ensures error categorization, code typing, and safe message representation without leaking secrets.
 */
export type VaultErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'VAULT_NOT_FOUND'
  | 'VAULT_CORRUPTED'
  | 'UNSUPPORTED_VAULT_VERSION'
  | 'MIGRATION_FAILED'
  | 'IMPORT_VALIDATION_FAILED'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'CRYPTO_OPERATION_FAILED'
  | 'RECOVERY_VERIFICATION_FAILED'
  | 'NETWORK_RESTRICTED'
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED';

export interface VaultErrorDetails {
  readonly code: VaultErrorCode;
  readonly message: string;
  readonly userMessage: string;
  readonly cause?: unknown;
}

export abstract class BaseVaultError extends Error {
  readonly code: VaultErrorCode;
  readonly userMessage: string;

  constructor(details: VaultErrorDetails) {
    super(details.message);
    this.name = this.constructor.name;
    this.code = details.code;
    this.userMessage = details.userMessage;
    if (details.cause !== undefined) {
      this.cause = details.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationFailedError extends BaseVaultError {
  constructor(message = 'Invalid master password or credentials', cause?: unknown) {
    super({
      code: 'AUTHENTICATION_FAILED',
      message,
      userMessage: 'Incorrect password. Please verify and try again.',
      cause,
    });
  }
}

export class VaultNotFoundError extends BaseVaultError {
  constructor(message = 'No vault found in local storage', cause?: unknown) {
    super({
      code: 'VAULT_NOT_FOUND',
      message,
      userMessage: 'No vault was found on this device.',
      cause,
    });
  }
}

export class VaultCorruptedError extends BaseVaultError {
  constructor(message = 'Vault data integrity check failed or container is corrupted', cause?: unknown) {
    super({
      code: 'VAULT_CORRUPTED',
      message,
      userMessage: 'The vault data appears corrupted or has been tampered with.',
      cause,
    });
  }
}

export class UnsupportedVaultVersionError extends BaseVaultError {
  constructor(version: number, cause?: unknown) {
    super({
      code: 'UNSUPPORTED_VAULT_VERSION',
      message: `Vault format version ${version} is not supported by this version of AegisVault`,
      userMessage: `This vault was created with a newer version of AegisVault (v${version}). Please update the application.`,
      cause,
    });
  }
}

export class MigrationFailedError extends BaseVaultError {
  constructor(message = 'Vault migration could not be completed safely', cause?: unknown) {
    super({
      code: 'MIGRATION_FAILED',
      message,
      userMessage: 'Vault upgrade failed. Your existing vault was preserved safely.',
      cause,
    });
  }
}

export class ImportValidationFailedError extends BaseVaultError {
  constructor(reason: string, cause?: unknown) {
    super({
      code: 'IMPORT_VALIDATION_FAILED',
      message: `Import failed schema validation: ${reason}`,
      userMessage: `The imported file is not a valid AegisVault format (${reason}).`,
      cause,
    });
  }
}

export class StorageQuotaExceededError extends BaseVaultError {
  constructor(message = 'Device storage quota exceeded', cause?: unknown) {
    super({
      code: 'STORAGE_QUOTA_EXCEEDED',
      message,
      userMessage: 'Not enough storage space available on this device.',
      cause,
    });
  }
}

export class AttachmentTooLargeError extends BaseVaultError {
  constructor(sizeBytes: number, maxBytes: number, cause?: unknown) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    super({
      code: 'ATTACHMENT_TOO_LARGE',
      message: `Attachment size ${sizeMb}MB exceeds limit of ${maxMb}MB`,
      userMessage: `Attachment is too large (${sizeMb} MB). Maximum allowed size is ${maxMb} MB.`,
      cause,
    });
  }
}

export class CryptoOperationFailedError extends BaseVaultError {
  constructor(operation: string, cause?: unknown) {
    super({
      code: 'CRYPTO_OPERATION_FAILED',
      message: `Cryptographic operation failed: ${operation}`,
      userMessage: 'A cryptographic error occurred. Please try again.',
      cause,
    });
  }
}

export class RecoveryVerificationFailedError extends BaseVaultError {
  constructor(message = 'Recovery phrase verification failed', cause?: unknown) {
    super({
      code: 'RECOVERY_VERIFICATION_FAILED',
      message,
      userMessage: 'The recovery words provided did not match the vault verification record.',
      cause,
    });
  }
}

export class NetworkRestrictedError extends BaseVaultError {
  constructor(url: string, cause?: unknown) {
    super({
      code: 'NETWORK_RESTRICTED',
      message: `Attempted network connection to ${url} blocked by offline security policy`,
      userMessage: 'AegisVault is running in offline mode. Network calls are strictly blocked.',
      cause,
    });
  }
}

export class VaultItemNotFoundError extends BaseVaultError {
  constructor(message = 'Vault item not found', cause?: unknown) {
    super({
      code: 'INVALID_INPUT',
      message,
      userMessage: 'The requested vault item was not found.',
      cause,
    });
  }
}

export class ValidationError extends BaseVaultError {
  constructor(message: string, cause?: unknown) {
    super({
      code: 'INVALID_INPUT',
      message,
      userMessage: message,
      cause,
    });
  }
}

