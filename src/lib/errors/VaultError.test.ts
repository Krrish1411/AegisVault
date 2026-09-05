import { describe, it, expect } from 'vitest';
import {
  AuthenticationFailedError,
  VaultNotFoundError,
  VaultCorruptedError,
  UnsupportedVaultVersionError,
  MigrationFailedError,
  ImportValidationFailedError,
  StorageQuotaExceededError,
  AttachmentTooLargeError,
  CryptoOperationFailedError,
  RecoveryVerificationFailedError,
  NetworkRestrictedError,
  BaseVaultError,
} from './VaultError';

describe('VaultError Hierarchy', () => {
  it('should instantiate AuthenticationFailedError with safe user message', () => {
    const error = new AuthenticationFailedError();
    expect(error).toBeInstanceOf(BaseVaultError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('AUTHENTICATION_FAILED');
    expect(error.userMessage).toContain('Incorrect password');
  });

  it('should instantiate VaultNotFoundError with proper code', () => {
    const error = new VaultNotFoundError();
    expect(error.code).toBe('VAULT_NOT_FOUND');
    expect(error.userMessage).toContain('No vault was found');
  });

  it('should instantiate VaultCorruptedError', () => {
    const error = new VaultCorruptedError('Checksum mismatch');
    expect(error.code).toBe('VAULT_CORRUPTED');
    expect(error.userMessage).toContain('corrupted');
  });

  it('should instantiate UnsupportedVaultVersionError with version info', () => {
    const error = new UnsupportedVaultVersionError(99);
    expect(error.code).toBe('UNSUPPORTED_VAULT_VERSION');
    expect(error.userMessage).toContain('v99');
  });

  it('should instantiate MigrationFailedError', () => {
    const error = new MigrationFailedError();
    expect(error.code).toBe('MIGRATION_FAILED');
    expect(error.userMessage).toContain('preserved safely');
  });

  it('should instantiate ImportValidationFailedError', () => {
    const error = new ImportValidationFailedError('Missing formatVersion');
    expect(error.code).toBe('IMPORT_VALIDATION_FAILED');
    expect(error.userMessage).toContain('Missing formatVersion');
  });

  it('should instantiate StorageQuotaExceededError', () => {
    const error = new StorageQuotaExceededError();
    expect(error.code).toBe('STORAGE_QUOTA_EXCEEDED');
    expect(error.userMessage).toContain('storage space');
  });

  it('should instantiate AttachmentTooLargeError with human-readable MBs', () => {
    const error = new AttachmentTooLargeError(60 * 1024 * 1024, 50 * 1024 * 1024);
    expect(error.code).toBe('ATTACHMENT_TOO_LARGE');
    expect(error.userMessage).toContain('60.0 MB');
    expect(error.userMessage).toContain('50 MB');
  });

  it('should instantiate CryptoOperationFailedError without leaking keys', () => {
    const error = new CryptoOperationFailedError('aead_decrypt');
    expect(error.code).toBe('CRYPTO_OPERATION_FAILED');
    expect(error.userMessage).toBe('A cryptographic error occurred. Please try again.');
  });

  it('should instantiate RecoveryVerificationFailedError', () => {
    const error = new RecoveryVerificationFailedError();
    expect(error.code).toBe('RECOVERY_VERIFICATION_FAILED');
    expect(error.userMessage).toContain('recovery words');
  });

  it('should instantiate NetworkRestrictedError with blocked url', () => {
    const error = new NetworkRestrictedError('https://analytics.example.com');
    expect(error.code).toBe('NETWORK_RESTRICTED');
    expect(error.message).toContain('https://analytics.example.com');
    expect(error.userMessage).toContain('offline mode');
  });
});
