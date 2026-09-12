export type VaultId = string;
export type ItemId = string;
export type FolderId = string;
export type AttachmentId = string;

export type AppMode = 'simple' | 'advanced';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface VaultSettings {
  readonly autoLockMinutes: number;
  readonly lockOnVisibilityHidden: boolean;
  readonly clearClipboardSeconds: number;
  readonly appMode: AppMode;
  readonly theme: ThemeMode;
  readonly defaultPasswordLength: number;
}

export const DEFAULT_VAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 5,
  lockOnVisibilityHidden: true,
  clearClipboardSeconds: 30,
  appMode: 'simple',
  theme: 'dark',
  defaultPasswordLength: 20,
};

export interface VaultMetadata {
  readonly id: VaultId;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly formatVersion: number;
  readonly cryptoProfile: string;
}

export type VaultItemType =
  | 'login'
  | 'email'
  | 'application'
  | 'bank_login'
  | 'bank_account'
  | 'bank_profile'
  | 'debit_card'
  | 'credit_card'
  | 'upi'
  | 'upi_pin'
  | 'atm_pin'
  | 'identity'
  | 'address'
  | 'pan'
  | 'aadhaar'
  | 'passport'
  | 'driving_license'
  | 'voter_id'
  | 'tax_id'
  | 'insurance'
  | 'emergency_contact'
  | 'secure_note'
  | 'totp'
  | 'api_key'
  | 'ssh_key'
  | 'wallet_seed'
  | 'private_key'
  | 'document'
  | 'custom';

export interface CustomField {
  readonly id: string;
  readonly label: string;
  readonly type: 'text' | 'secret' | 'number' | 'date' | 'boolean' | 'url' | 'email' | 'phone' | 'multiline';
  readonly value: string;
}

export interface PasswordHistoryEntry {
  readonly id: string;
  readonly password: string;
  readonly archivedAt: string;
}

export interface LoginPayload {
  readonly username?: string;
  readonly password?: string;
  readonly urls?: readonly string[];
  readonly totpSecret?: string;
  readonly notes?: string;
  readonly expiresAt?: string;
  readonly expirationIntervalDays?: number;
  readonly lastPasswordRotatedAt?: string;
}

export interface CardPayload {
  readonly cardholderName?: string;
  readonly cardNumber?: string;
  readonly expiryMonth?: string;
  readonly expiryYear?: string;
  readonly cvv?: string;
  readonly pin?: string;
  readonly cardType?: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'discover' | 'other';
  readonly billingAddress?: string;
  readonly notes?: string;
}

export interface MpinHistoryEntry {
  readonly id: string;
  readonly pin: string;
  readonly archivedAt: string;
}

export interface BankAccountPayload {
  readonly bankName?: string;
  readonly accountHolderName?: string;
  readonly accountNumber?: string;
  readonly routingNumber?: string;
  readonly ifscCode?: string;
  readonly iban?: string;
  readonly swiftBic?: string;
  readonly branchName?: string;
  readonly customerId?: string;
  readonly accountType?: 'checking' | 'savings' | 'current' | 'salary' | 'fixed_deposit';

  // NetBanking & Security Passwords
  readonly netBankingUserId?: string;
  readonly netBankingPassword?: string;
  readonly profilePassword?: string;
  readonly transactionPassword?: string;

  // Mobile Banking & PINs
  readonly mpin?: string;
  readonly mpinHistory?: readonly MpinHistoryEntry[];
  readonly atmPin?: string;
  readonly upiId?: string;

  readonly notes?: string;
}

export interface BankLoginPayload {
  readonly bankName?: string;
  readonly loginUrl?: string;
  readonly username?: string;
  readonly password?: string;
  readonly transactionPassword?: string;
  readonly securityQuestions?: readonly { question: string; answer: string }[];
  readonly notes?: string;
}

export interface BankProfilePayload {
  readonly bankName?: string;
  readonly userId?: string;
  readonly profilePassword?: string;
  readonly transactionPin?: string;
  readonly notes?: string;
}

export interface UpiPayload {
  readonly upiId?: string;
  readonly registeredPhone?: string;
  readonly linkedBank?: string;
  readonly upiPin?: string;
  readonly notes?: string;
}

export interface UpiPinPayload {
  readonly upiId?: string;
  readonly upiPin?: string;
  readonly linkedAccount?: string;
  readonly notes?: string;
}

export interface AtmPinPayload {
  readonly cardTitle?: string;
  readonly bankName?: string;
  readonly pin?: string;
  readonly last4Digits?: string;
  readonly notes?: string;
}

export interface IdentityPayload {
  readonly fullName?: string;
  readonly dateOfBirth?: string;
  readonly gender?: 'male' | 'female' | 'other' | 'unspecified';
  readonly nationality?: string;
  readonly bloodGroup?: string;
  readonly address?: string;
  readonly notes?: string;
}

export interface AddressPayload {
  readonly profileType?: 'real' | 'temporary';
  readonly fullName?: string;
  readonly title?: string;
  readonly company?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly purpose?: string;
  readonly notes?: string;
}

export interface PanPayload {
  readonly panNumber?: string;
  readonly fullName?: string;
  readonly fatherName?: string;
  readonly dateOfBirth?: string;
  readonly notes?: string;
}

export interface AadhaarPayload {
  readonly aadhaarNumber?: string;
  readonly fullName?: string;
  readonly dateOfBirth?: string;
  readonly registeredPhone?: string;
  readonly address?: string;
  readonly notes?: string;
}

export interface PassportPayload {
  readonly passportNumber?: string;
  readonly country?: string;
  readonly fullName?: string;
  readonly issueDate?: string;
  readonly expiryDate?: string;
  readonly placeOfIssue?: string;
  readonly nationality?: string;
  readonly notes?: string;
}

export interface DrivingLicensePayload {
  readonly licenseNumber?: string;
  readonly issuingAuthority?: string;
  readonly fullName?: string;
  readonly issueDate?: string;
  readonly expiryDate?: string;
  readonly vehicleClasses?: readonly string[];
  readonly address?: string;
  readonly notes?: string;
}

export interface VoterIdPayload {
  readonly epicNumber?: string;
  readonly fullName?: string;
  readonly constituency?: string;
  readonly state?: string;
  readonly notes?: string;
}

export interface TaxIdPayload {
  readonly taxIdNumber?: string;
  readonly taxIdType?: 'ssn' | 'ein' | 'tin' | 'other';
  readonly country?: string;
  readonly legalName?: string;
  readonly notes?: string;
}

export interface InsurancePayload {
  readonly policyNumber?: string;
  readonly insurerName?: string;
  readonly policyType?: 'health' | 'life' | 'vehicle' | 'home' | 'travel' | 'other';
  readonly sumInsured?: string;
  readonly startDate?: string;
  readonly expiryDate?: string;
  readonly emergencyContact?: string;
  readonly notes?: string;
}

export interface EmergencyContactPayload {
  readonly contactName?: string;
  readonly relationship?: string;
  readonly primaryPhone?: string;
  readonly secondaryPhone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly notes?: string;
}

export interface CheckboxItem {
  readonly id: string;
  readonly text: string;
  readonly checked: boolean;
}

export interface SecureNotePayload {
  readonly content?: string;
  readonly isMarkdown?: boolean;
  readonly checklist?: readonly CheckboxItem[];
  readonly notes?: string;
}

export interface DocumentPayload {
  readonly description?: string;
  readonly documentType?:
    | 'id_card'
    | 'passport'
    | 'tax_return'
    | 'medical'
    | 'contract'
    | 'certificate'
    | 'financial'
    | 'cancelled_cheque'
    | 'passbook'
    | 'other';
  readonly attachmentId?: AttachmentId;
  readonly linkedItemId?: string | undefined;
  readonly linkedItemType?: string | undefined;
  readonly linkedItemTitle?: string | undefined;
  readonly filename?: string;
  readonly mediaType?: string;
  readonly sizeBytes?: number;
  readonly referenceNumber?: string;
  readonly notes?: string;
}

export interface TotpPayload {
  readonly secret?: string; // base32 encoded TOTP key
  readonly issuer?: string;
  readonly account?: string;
  readonly algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  readonly digits?: 6 | 8;
  readonly period?: number; // default 30
  readonly notes?: string;
}

export interface WalletSeedPayload {
  readonly seedPhrase?: string; // BIP39 mnemonic
  readonly wordCount?: 12 | 15 | 18 | 21 | 24;
  readonly passphrase?: string; // Optional 25th word
  readonly blockchain?: 'bitcoin' | 'ethereum' | 'solana' | 'cosmos' | 'polygon' | 'multi' | 'other';
  readonly primaryAddress?: string;
  readonly derivationPath?: string;
  readonly notes?: string;
}

export interface PrivateKeyPayload {
  readonly privateKey?: string;
  readonly keyType?: 'ethereum' | 'bitcoin' | 'solana' | 'ed25519' | 'rsa' | 'secp256k1' | 'other';
  readonly publicKeyOrAddress?: string;
  readonly blockchain?: string;
  readonly notes?: string;
}

export interface ApiKeyPayload {
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly serviceName?: string;
  readonly endpoint?: string;
  readonly notes?: string;
}

export interface SshKeyPayload {
  readonly privateKey?: string;
  readonly publicKey?: string;
  readonly passphrase?: string;
  readonly keyType?: 'ed25519' | 'rsa' | 'ecdsa';
  readonly fingerprint?: string;
  readonly notes?: string;
}

export interface VaultRecord {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly isDefault?: boolean;
  readonly createdAt: string;
}

export interface VaultItemEnvelope<TPayload = Record<string, unknown>> {
  readonly id: ItemId;
  readonly type: VaultItemType;
  readonly title: string;
  readonly favorite: boolean;
  readonly archived: boolean;
  readonly vaultId?: string | undefined;
  readonly folderId?: FolderId | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly payload: TPayload;
  readonly customFields?: readonly CustomField[] | undefined;
  readonly passwordHistory?: readonly PasswordHistoryEntry[] | undefined;
  readonly attachmentIds?: readonly AttachmentId[] | undefined;
  readonly linkedItemIds?: readonly string[] | undefined;
  readonly expiresAt?: string | undefined;
}

export interface EmergencyContact {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly relationship?: string | undefined;
  readonly accessLevel: 'full' | 'selected';
  readonly waitPeriodDays: number; // 0 = instant, 3, 7, 14, 30
  readonly status: 'active' | 'pending' | 'requested' | 'approved' | 'revoked';
  readonly requestDate?: string | undefined;
  readonly grantKeyHash?: string | undefined;
  readonly grantData?: string | undefined;
  readonly createdAt: string;
}

export interface VaultFolder {
  readonly id: FolderId;
  readonly name: string;
  readonly parentId?: FolderId;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface AttachmentMetadata {
  readonly id: AttachmentId;
  readonly filename: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
  readonly favorite?: boolean | undefined;
  readonly linkedItemId?: string | undefined;
  readonly linkedItemTitle?: string | undefined;
}

export interface AuditEvent {
  readonly id: string;
  readonly action: string;
  readonly timestamp: string;
  readonly details?: Record<string, string | number | boolean>;
}

export interface DecryptedVaultDomain {
  readonly metadata: VaultMetadata;
  readonly settings: VaultSettings;
  readonly vaults?: readonly VaultRecord[];
  readonly items: readonly VaultItemEnvelope[];
  readonly folders: readonly VaultFolder[];
  readonly attachments: readonly AttachmentMetadata[];
  readonly auditEvents: readonly AuditEvent[];
  readonly emergencyContacts?: readonly EmergencyContact[];
}
