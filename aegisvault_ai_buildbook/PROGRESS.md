# AegisVault — AI Build Progress

> This file is the durable memory of the build. Every coding agent must read it before doing work and update it at the end of every phase/session.

## Current state

- Current phase: 10 — Migration, Upgrade Path & PWA Hardening
- Status: COMPLETE
- Last completed phase: 10 — Migration, Upgrade Path & PWA Hardening
- Last verified commit: local build verified
- Last updated: 2026-09-02

## Phase status

| Phase | Name | Status | Started | Completed | Verification |
|---|---|---|---|---|---|
| 0 | Foundation & Architecture | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 38 unit tests (pass), ESLint (pass), Vite build (pass) |
| 1 | Vault Core & Simple Login Vault | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 61 tests (pass), ESLint (pass), Vite build (pass) |
| 2 | Secret Generation & Session Safety | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 83 tests (pass), ESLint (pass), Vite build (pass) |
| 3 | Recovery & Encrypted Import/Export | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 99 tests (pass), ESLint (pass), Vite build (pass) |
| 4 | Security Center & Password Health | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 105 tests (pass), ESLint (pass), Vite build (pass) |
| 5 | Organization, Search & History | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 117 tests (pass), ESLint (pass), Vite build (pass) |
| 6 | Personal Data, Banking & Cards | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 127 tests (pass), ESLint (pass), Vite build (pass) |
| 7 | Documents, Attachments & Secure Notes | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 133 tests (pass), ESLint (pass), Vite build (pass) |
| 8 | TOTP, Wallets & Recovery Materials | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 144 tests (pass), ESLint (pass), Vite build (pass) |
| 9 | Sharing, Emergency Kit & Optional Online Check | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 152 tests (pass), ESLint (pass), Vite build (pass) |
| 10 | Migration, Upgrade Path & PWA Hardening | COMPLETE | 2026-09-02 | 2026-09-02 | Typecheck (0 err), 159 tests (pass), ESLint (pass), Vite build (pass) |
| 11 | Desktop/Mobile Readiness | NOT STARTED | | | |

## How to update this file

For every phase completion, replace the phase status and append a record below.

Use one of:
- NOT STARTED
- IN PROGRESS
- BLOCKED
- COMPLETE
- COMPLETE WITH FOLLOW-UP

Never mark a phase COMPLETE when required tests are failing.

## Current architecture decisions

- UI framework: React 19 + TypeScript
- Build tool: Vite
- Styling: Tailwind CSS + customized semantic tokens (tokens.css + globals.css)
- Browser persistence: IndexedDB through explicit repository ports (VaultRepository, AttachmentRepository, AuditRepository)
- Cryptography: libsodium-backed interface (CryptoProvider) without leaking primitives to UI
- KDF: Argon2id interface and constants
- Primary vault encryption: XChaCha20-Poly1305 IETF specification
- App state: ephemeral Zustand session/UI state only; vault persistence is encrypted domain data
- Routing: React Router (createBrowserRouter)
- Validation: Zod
- Unit/integration testing: Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- Browser E2E: Playwright
- Future desktop: Tauri 2
- Future mobile: Capacitor/native secure integrations

## Current security invariants

1. Master password is never persisted.
2. Recovery phrase is never persisted in plaintext.
3. Persistent vault content is encrypted.
4. No plaintext secret search index is persisted.
5. No secret values are written to logs, URLs, analytics, or telemetry.
6. `Math.random()` is never used for security-sensitive randomness.
7. Authenticated encryption is used for vault data.
8. Nonces are unique according to the chosen construction and protocol.
9. Security-critical keys have separate purposes.
10. Migration preserves the previous valid vault until the new version is successfully committed.
11. Existing vault unlock never requires an internet connection.
12. Simple and Advanced modes share the exact same security layer.

## Last session notes

### 2026-09-02 (Phase 10 Execution — Migration, Crypto Upgrade Path & PWA Hardening)

- **Work completed**:
  - Implemented [`migrationEngine.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/migration/migrationEngine.ts) with explicit container format versioning, migration registry, preflight validation, atomic multi-step migration, and zero-payload re-encryption KDF parameter upgrades (strengthening Argon2id memory cost while leaving encrypted payloads untouched).
  - Built [`externalImporters.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/migration/externalImporters.ts) and [`ImportExternalModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/migration/ImportExternalModal.tsx) for auto-detecting and migrating credentials from Bitwarden (JSON/CSV), 1Password (CSV), KeePass (CSV), and Chrome/Firefox/Safari browser CSVs.
  - Built [`VaultUpgradeModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/migration/VaultUpgradeModal.tsx) enabling users to upgrade their vault's Argon2id memory parameters (32MB, 64MB, 128MB) safely on device.
  - Implemented [`pwaService.ts`](file:///home/krish/Downloads/Coding/vault/src/platform/pwa/pwaService.ts) and [`PwaUpdateBanner.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/pwa/PwaUpdateBanner.tsx) guaranteeing controlled, explicit user updates without silent background code replacements.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 40 test suites / 159 tests) — **PASS** (159/159 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 5.95s).
- **Files changed**:
  - `src/domain/migration/migrationEngine.ts`
  - `src/domain/migration/migrationEngine.test.ts`
  - `src/domain/migration/externalImporters.ts`
  - `src/domain/migration/externalImporters.test.ts`
  - `src/platform/pwa/pwaService.ts`
  - `src/features/pwa/PwaUpdateBanner.tsx`
  - `src/features/migration/ImportExternalModal.tsx`
  - `src/features/migration/VaultUpgradeModal.tsx`
  - `src/features/settings/SettingsScreen.tsx`
  - `src/app/App.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - Migration preflight blocks future incompatible versions cleanly without data loss.
  - KDF upgrades re-wrap the root Vault Key without re-encrypting item payloads, minimizing cipher wear and race hazards.
  - PWA updates require explicit user interaction before reloading active sessions.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 11 — Desktop/Mobile Readiness & Final Polish** (`phases/PHASE-11.md`).

- **Work completed**:
  - Implemented [`sharingEngine.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/sharing/sharingEngine.ts) for exporting and importing `.aegispkg` encrypted bundles with independent passphrases (master password is never shared), folder scoping, selected items, and granular role assignments (`owner`, `admin`, `member`, `view_only`, `restricted`).
  - Built [`ExportShareModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/sharing/ExportShareModal.tsx) and [`ImportShareModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/sharing/ImportShareModal.tsx) UI components for end-to-end encrypted sharing workflows.
  - Implemented [`emergencyKit.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/emergency/emergencyKit.ts) and [`EmergencyKitModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/emergency/EmergencyKitModal.tsx) for generating beautiful, customized printable cold-storage emergency kits for trusted contacts and legal executors.
  - Implemented [`breachChecker.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/breach/breachChecker.ts) and [`OnlineBreachCheckModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/security-center/OnlineBreachCheckModal.tsx) utilizing a privacy-preserving k-Anonymity model (only first 5 SHA-1 hex chars transmitted; plaintext passwords and usernames never leave the browser) strictly guarded by mandatory explicit consent toggles.
  - Added Duress Vault Guidance to [`SettingsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/settings/SettingsScreen.tsx) disclosing the technical boundaries of browser IndexedDB storage and why forensic plausible deniability cannot be claimed against forensic hardware extraction.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 38 test suites / 152 tests) — **PASS** (152/152 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.29s).
- **Files changed**:
  - `src/domain/sharing/sharingEngine.ts`
  - `src/domain/sharing/sharingEngine.test.ts`
  - `src/domain/emergency/emergencyKit.ts`
  - `src/domain/emergency/emergencyKit.test.ts`
  - `src/domain/breach/breachChecker.ts`
  - `src/domain/breach/breachChecker.test.ts`
  - `src/features/sharing/ExportShareModal.tsx`
  - `src/features/sharing/ImportShareModal.tsx`
  - `src/features/emergency/EmergencyKitModal.tsx`
  - `src/features/security-center/OnlineBreachCheckModal.tsx`
  - `src/features/security-center/SecurityCenterScreen.tsx`
  - `src/features/settings/SettingsScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - Master passwords are never shared in exported family bundles; recipient decryption keys are independently derived via Argon2id.
  - Breach checks are strictly opt-in, default to disabled, and obey k-anonymity 5-character prefix queries without leaking sensitive account contexts.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 10 — Migration, Upgrade Path & PWA Hardening** (`phases/PHASE-10.md`).

- **Work completed**:
  - Implemented RFC 6238 TOTP Engine in [`totpEngine.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/totp/totpEngine.ts) with Base32 decoding, HMAC SHA-1/SHA-256/SHA-512 code generation, `otpauth://` URI parsing, and time-step countdown progress calculations.
  - Built [`TotpCardDisplay.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/items/TotpCardDisplay.tsx) component with live 1s animated progress countdown, large formatted 6-digit code display, and one-click copy with clipboard timeout.
  - Implemented Crypto Wallet & Recovery Engine in [`walletEngine.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/wallets/walletEngine.ts) supporting BIP39 seed phrases across 12, 15, 18, 21, and 24 word lengths, checksum verification, 25th word passphrases, and cold emergency sheet generation.
  - Maintained strict product invariant: cryptocurrency wallet seed phrases and private keys are never confused with AegisVault's master account recovery phrase in data models or UI copy.
  - Upgraded [`AddEditItemModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/items/AddEditItemModal.tsx) and [`ItemDetailSheet.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/items/ItemDetailSheet.tsx) with specialized forms, masked word chip displays, and private key representations.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 35 test suites / 144 tests) — **PASS** (144/144 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.34s).
- **Files changed**:
  - `src/domain/vault/types.ts`
  - `src/domain/totp/totpEngine.ts`
  - `src/domain/totp/totpEngine.test.ts`
  - `src/domain/wallets/walletEngine.ts`
  - `src/domain/wallets/walletEngine.test.ts`
  - `src/application/services/AppVaultServicePhase8.test.ts`
  - `src/features/items/TotpCardDisplay.tsx`
  - `src/features/items/AddEditItemModal.tsx`
  - `src/features/items/ItemDetailSheet.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - TOTP secret keys and cryptocurrency wallet seed phrases are encrypted locally and never transmitted across network or unencrypted logs.
  - Secret words and private keys are masked by default with explicit visual reveal toggles.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 09 — Secure Export, Emergency Kit & Optional Online Check** (`phases/PHASE-09.md`).

- **Work completed**:
  - Implemented [`attachmentEngine.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/attachments/attachmentEngine.ts) with authenticated binary blob encryption using XChaCha20-Poly1305, SHA-256 integrity checksums, single-file size enforcement ($\le 50\text{ MB}$), recommended storage ceiling ($500\text{ MB}$), and browser storage quota estimation.
  - Extended [`DexieVaultRepository.ts`](file:///home/krish/Downloads/Coding/vault/src/storage/indexeddb/DexieVaultRepository.ts) with dedicated `attachments` IndexedDB store and atomic multi-table purge on vault delete.
  - Implemented [`AppVaultService.ts`](file:///home/krish/Downloads/Coding/vault/src/application/services/AppVaultService.ts) attachment APIs (`addAttachment`, `getDecryptedAttachment`, `deleteAttachment`, `getAttachmentTotalBytes`) with automatic metadata encapsulation in decrypted domain manifests.
  - Built [`NotesScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/notes/NotesScreen.tsx) with interactive checkable task checklists, markdown editing/preview toggles, character/word counters, tag/folder management, and important note flagging.
  - Built [`DocumentsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/documents/DocumentsScreen.tsx) with file drag-and-drop upload zone, storage quota indicator bar, in-memory preview modal (for images, text, and PDF) with instantaneous memory cleanup, and secure downloads.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 32 test suites / 133 tests) — **PASS** (133/133 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.23s).
- **Files changed**:
  - `src/domain/vault/types.ts`
  - `src/storage/ports/VaultRepository.ts`
  - `src/storage/indexeddb/DexieVaultRepository.ts`
  - `src/domain/attachments/attachmentEngine.ts`
  - `src/domain/attachments/attachmentEngine.test.ts`
  - `src/application/services/VaultService.ts`
  - `src/application/services/AppVaultService.ts`
  - `src/application/services/AppVaultServicePhase7.test.ts`
  - `src/features/notes/NotesScreen.tsx`
  - `src/features/documents/DocumentsScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - Attachment blobs are encrypted with authenticated ciphers before writing to disk; manifest metadata is sealed inside the vault container.
  - Object URLs created for document viewing/download are strictly memory-resident and revoked immediately upon modal closure or file dispatch.
  - Locking the vault purges decrypted attachment caches from volatile memory.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 08 — TOTP, Wallets & Recovery Materials** (`phases/PHASE-08.md`).

- **Work completed**:
  - Implemented typed domain models and schemas for 14+ record types: `bank_login`, `bank_account`, `bank_profile`, `credit_card`, `debit_card`, `upi`, `upi_pin`, `atm_pin`, `identity`, `pan`, `aadhaar`, `passport`, `driving_license`, `voter_id`, `tax_id`, `insurance`, and `emergency_contact`.
  - Implemented [`cardHelpers.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/cards/cardHelpers.ts) with:
    - Standard Luhn (mod-10) checksum validation.
    - BIN issuer detection (Visa, Mastercard, Amex, RuPay, Discover).
    - Safe visual number formatting and masking (`•••• •••• •••• 1234`).
    - 12-digit Aadhaar masking (`•••• •••• 1234`) and Indian PAN card uppercase formatting.
  - Implemented [`AddEditItemModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/items/AddEditItemModal.tsx) with dynamic form generation tailored to credential, banking, payment card, or identity document records with embedded password generator support.
  - Implemented [`ItemDetailSheet.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/items/ItemDetailSheet.tsx) with progressive disclosure: sensitive fields (card number, CVV, PIN, account number, PAN, Aadhaar) are masked by default with reveal/hide eye toggles and copy-to-clipboard with auto-clear timers.
  - Upgraded [`CardsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/cards/CardsScreen.tsx), [`BankingScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/banking/BankingScreen.tsx), and [`IdentityScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/identity/IdentityScreen.tsx) with live category filtering, multi-token in-memory search, and full CRUD operations.
  - Upgraded [`InMemorySearchIndex`](file:///home/krish/Downloads/Coding/vault/src/domain/organization/searchIndex.ts) to index all payload fields across all item types dynamically while maintaining zero persistent storage invariants.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 30 test suites / 127 tests) — **PASS** (127/127 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.58s).
- **Files changed**:
  - `src/domain/vault/types.ts`
  - `src/domain/cards/cardHelpers.ts`
  - `src/domain/cards/cardHelpers.test.ts`
  - `src/domain/organization/searchIndex.ts`
  - `src/application/services/AppVaultServicePhase6.test.ts`
  - `src/features/items/AddEditItemModal.tsx`
  - `src/features/items/ItemDetailSheet.tsx`
  - `src/features/items/index.ts`
  - `src/features/cards/CardsScreen.tsx`
  - `src/features/banking/BankingScreen.tsx`
  - `src/features/identity/IdentityScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - All financial and identity records are sealed using the same authenticated XChaCha20-Poly1305 payload encryption.
  - Sensitive numbers and PINs remain masked on screen unless explicitly toggled by user interaction.
  - Clipboard writes honor user-configured auto-clear timeouts.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 07 — Documents, Attachments & Secure Notes** (`phases/PHASE-07.md`).

- **Work completed**:
  - Implemented [`InMemorySearchIndex`](file:///home/krish/Downloads/Coding/vault/src/domain/organization/searchIndex.ts) for fast, client-side multi-token search indexing across titles, usernames, URLs, tags, folders, and notes.
  - Verified critical invariant: search index resides strictly in memory, is never persisted to disk, and is completely purged when the vault is locked.
  - Built nested folder hierarchy engine in [`folderTree.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/organization/folderTree.ts) with depth tracking, item aggregation, and cyclic move validation (`validateFolderMove`).
  - Implemented folder management modal [`FolderManagerModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/organization/FolderManagerModal.tsx) with nested tree view, folder creation, renaming, and safe deletion (moving items to root).
  - Enhanced [`AddEditPasswordModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/AddEditPasswordModal.tsx) with folder assignment and interactive tags chip editor.
  - Enhanced [`PasswordDetailSheet.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/PasswordDetailSheet.tsx) with password history restoration (`restorePasswordFromHistory`), single history deletion, clearing entire history, and archive/favorite toggling.
  - Upgraded [`PasswordsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/PasswordsScreen.tsx) with live multi-token search, category pills (All, Favorites, Archive), folder selector, tag filter chips, and sort orders (`recently_updated`, `title_asc`, `title_desc`, `created_newest`, `created_oldest`).
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 28 test suites / 117 tests) — **PASS** (117/117 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.50s).
- **Files changed**:
  - `src/domain/vault/types.ts`
  - `src/security/serialization/vaultSerializer.ts`
  - `src/lib/errors/VaultError.ts`
  - `src/domain/organization/searchIndex.ts`
  - `src/domain/organization/searchIndex.test.ts`
  - `src/domain/organization/folderTree.ts`
  - `src/domain/organization/folderTree.test.ts`
  - `src/domain/organization/index.ts`
  - `src/application/services/VaultService.ts`
  - `src/application/services/AppVaultService.ts`
  - `src/application/services/AppVaultServicePhase5.test.ts`
  - `src/features/organization/FolderManagerModal.tsx`
  - `src/features/passwords/AddEditPasswordModal.tsx`
  - `src/features/passwords/PasswordDetailSheet.tsx`
  - `src/features/passwords/PasswordsScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - Zero plaintext search indexes on disk; memory-only search index wiped on session lock.
  - Password history entries are stored inside the encrypted item payload envelope at rest.
  - Folder operations validated to prevent circular reference attacks.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 06 — Personal Data, Banking & Cards** (`phases/PHASE-06.md`).

- **Work completed**:
  - Implemented offline common/compromised password dictionary dataset in [`commonPasswords.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/security-center/commonPasswords.ts) with zero external network telemetry.
  - Built comprehensive deterministic [`securityAnalyzer.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/security-center/securityAnalyzer.ts) engine auditing:
    - Weak passwords (entropy $<60$ bits, length $<12$).
    - Reused / duplicate passwords across services.
    - Common / compromised passwords.
    - Old / stale credentials ($>180$ days).
    - Missing 2FA / TOTP configuration.
    - Predictability heuristics (repeating chars, keyboard sequences, year suffixes).
    - Weighted overall vault health score (0–100) and security ratings (`excellent`, `good`, `needs_attention`, `critical`).
  - Implemented actionable [`SecurityCenterScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/security-center/SecurityCenterScreen.tsx) dashboard with hero circular score meter, system status summary, interactive issue filter tabs, and direct remediation buttons (`Fix Credential`).
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 25 test suites / 105 tests) — **PASS** (105/105 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.89s).
- **Files changed**:
  - `src/domain/security-center/commonPasswords.ts`
  - `src/domain/security-center/securityAnalyzer.ts`
  - `src/domain/security-center/securityAnalyzer.test.ts`
  - `src/domain/security-center/index.ts`
  - `src/features/security-center/SecurityCenterScreen.tsx`
  - `src/features/security-center/SecurityCenterScreen.test.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - 100% offline analysis invariant verified: zero network requests emitted during password health and breach scans.
  - Finding remediation immediately connects with encrypted item updating and atomic persistence.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 05 — Organization, Search & History** (`phases/PHASE-05.md`).

- **Work completed**:
  - Integrated standard BIP39 mnemonic library (`@scure/bip39`) with 2048-word English dictionary and 8-bit checksums in [`bip39.ts`](file:///home/krish/Downloads/Coding/vault/src/security/crypto/bip39.ts).
  - Implemented independent recovery key wrapping in [`vaultCrypto.ts`](file:///home/krish/Downloads/Coding/vault/src/security/crypto/vaultCrypto.ts):
    - `wrapVaultKeyWithRecovery`: Derives Recovery Key via Argon2id from 24-word phrase and wraps the 256-bit Vault Encryption Key with XChaCha20-Poly1305.
    - `unwrapVaultKeyWithRecovery`: Recovers Vault Encryption Key from recovery phrase.
    - `rewrapVaultKeyWithNewPassword`: Changes master password by re-wrapping existing Vault Key with new Argon2id PDK without re-encrypting stored items.
  - Implemented standalone encrypted full-vault backup format in [`vaultExport.ts`](file:///home/krish/Downloads/Coding/vault/src/security/export/vaultExport.ts):
    - `exportEncryptedVault`: Exports version 1 `.aegisvault` container with independent Argon2id KDF parameters + XChaCha20-Poly1305 AEAD cipher.
    - `importEncryptedVault`: Strictly decrypts and validates schema with Zod, rejecting unsupported versions ($\gt 1$), malformed JSON, and tampered bytes.
  - Enhanced [`AppVaultService.ts`](file:///home/krish/Downloads/Coding/vault/src/application/services/AppVaultService.ts) with `recoverVault`, `changeMasterPassword`, `exportVault`, and `importVault` (supporting both `replace` and `merge` modes).
  - Built interactive UI components:
    - [`RecoverySetupModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/recovery/RecoverySetupModal.tsx): 24-word numbered grid, printable/downloadable emergency sheet kit, and 3-word confirmation challenge. Connected to [`CreateVaultModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/onboarding/CreateVaultModal.tsx).
    - [`RecoveryUnlockModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/recovery/RecoveryUnlockModal.tsx): 24-word entry with real-time BIP39 checksum validation + new password creation. Connected to [`UnlockScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/unlock/UnlockScreen.tsx).
    - [`ChangePasswordModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/recovery/ChangePasswordModal.tsx): Password modification modal connected to [`SettingsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/settings/SettingsScreen.tsx).
    - [`ExportBackupModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/backup/ExportBackupModal.tsx) & [`ImportBackupModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/backup/ImportBackupModal.tsx): Connected to [`SettingsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/settings/SettingsScreen.tsx).
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 23 test suites / 99 tests) — **PASS** (99/99 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.74s).
- **Files changed**:
  - `package.json`
  - `src/security/crypto/bip39.ts`
  - `src/security/crypto/bip39.test.ts`
  - `src/security/crypto/vaultCrypto.ts`
  - `src/security/crypto/vaultCryptoRecovery.test.ts`
  - `src/security/export/vaultExport.ts`
  - `src/security/export/vaultExport.test.ts`
  - `src/security/export/index.ts`
  - `src/application/services/VaultService.ts`
  - `src/application/services/AppVaultService.ts`
  - `src/application/services/AppVaultServicePhase3.test.ts`
  - `src/features/recovery/RecoverySetupModal.tsx`
  - `src/features/recovery/RecoveryUnlockModal.tsx`
  - `src/features/recovery/ChangePasswordModal.tsx`
  - `src/features/backup/ExportBackupModal.tsx`
  - `src/features/backup/ImportBackupModal.tsx`
  - `src/features/onboarding/CreateVaultModal.tsx`
  - `src/features/unlock/UnlockScreen.tsx`
  - `src/features/settings/SettingsScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - BIP39 recovery phrase uses 256-bit entropy (24 words).
  - Invariant verified: Recovery phrase plaintext is never stored in IndexedDB or logs; only the Argon2id-derived key wrapping is persisted.
  - Master password change re-wraps the 256-bit VEK without exposing or mutating raw payload items.
  - Active vault is strictly preserved during import until imported backup file is fully decrypted and schema-validated.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 04 — Security Center & Password Health** (`phases/PHASE-04.md`).

- **Work completed**:
  - Implemented [`secretGenerator.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/generator/secretGenerator.ts) implementing CSPRNG unbiased random generation (`getSecureRandomInt`) with rejection sampling to eliminate modulo bias.
  - Built three generator modalities:
    - **Password Generator**: 12–128 characters (default 20), uppercase/lowercase/numbers/symbols toggles, ambiguous character exclusion (`il1Lo0O`), guaranteed minimum character counts, and mathematical entropy calculation ($E = L \times \log_2(|\Sigma|)$).
    - **Passphrase Generator**: 3–12 words (default 5), custom separators, title/lower/upper casing, number insertion, and curated offline EFF wordlist ([`wordlist.ts`](file:///home/krish/Downloads/Coding/vault/src/domain/generator/wordlist.ts)).
    - **PIN Generator**: 4–12 numeric digits with CSPRNG.
  - Implemented standalone first-class [`GeneratorScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/generator/GeneratorScreen.tsx) with hero preview, color-coded syntax highlighting, entropy meter, auto-clear copy countdown feedback, and parameter sliders.
  - Implemented reusable [`GeneratorModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/generator/GeneratorModal.tsx) and embedded it in [`AddEditPasswordModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/AddEditPasswordModal.tsx).
  - Enhanced [`WebClipboardPort.ts`](file:///home/krish/Downloads/Coding/vault/src/platform/web/WebClipboardPort.ts) with 20-second default auto-clear timer, cancellable timers, and active inspection.
  - Enhanced [`sessionStore.ts`](file:///home/krish/Downloads/Coding/vault/src/state/sessionStore.ts), [`App.tsx`](file:///home/krish/Downloads/Coding/vault/src/app/App.tsx), and [`SettingsScreen.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/settings/SettingsScreen.tsx) with inactivity auto-lock (1/5/10/15/30m/Never), clipboard auto-clear (10/20/30/60s/Never), and lock-on-visibility-hidden (tab switch / minimize).
  - Added encrypted password history tracking in [`AddEditPasswordModal.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/AddEditPasswordModal.tsx) and history disclosure list in [`PasswordDetailSheet.tsx`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/PasswordDetailSheet.tsx).
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 19 test suites / 83 tests) — **PASS** (83/83 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 4.11s).
- **Files changed**:
  - `src/domain/generator/wordlist.ts`
  - `src/domain/generator/secretGenerator.ts`
  - `src/domain/generator/secretGenerator.test.ts`
  - `src/domain/generator/index.ts`
  - `src/features/generator/GeneratorScreen.tsx`
  - `src/features/generator/GeneratorScreen.test.tsx`
  - `src/features/generator/GeneratorModal.tsx`
  - `src/platform/web/WebClipboardPort.ts`
  - `src/platform/web/WebClipboardPort.test.ts`
  - `src/state/sessionStore.ts`
  - `src/app/App.tsx`
  - `src/app/router.tsx`
  - `src/ui/layout/AppShell.tsx`
  - `src/features/passwords/AddEditPasswordModal.tsx`
  - `src/features/passwords/PasswordDetailSheet.tsx`
  - `src/features/settings/SettingsScreen.tsx`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - CSPRNG rejection sampling verified to eliminate modulo bias.
  - Zero external network requests during passphrase/password generation.
  - Clipboard timer auto-clears sensitive data and resets if new secrets are copied.
  - Memory key purge verified on auto-lock and visibility hidden.
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 03 — Recovery & Encrypted Import/Export** (`phases/PHASE-03.md`).

- **Work completed**:
  - Integrated `libsodium-wrappers-sumo` inside [`SodiumCryptoProvider`](file:///home/krish/Downloads/Coding/vault/src/security/crypto/SodiumCryptoProvider.ts) implementing 256-bit CSPRNG, Argon2id KDF (`crypto_pwhash`), and XChaCha20-Poly1305 AEAD with cross-realm byte normalization.
  - Implemented [`vaultCrypto.ts`](file:///home/krish/Downloads/Coding/vault/src/security/crypto/vaultCrypto.ts) implementing random 256-bit Vault Encryption Key (VEK) generation, Password-Derived Key (PDK) wrapping, and authenticated payload encryption/decryption.
  - Implemented [`vaultSerializer.ts`](file:///home/krish/Downloads/Coding/vault/src/security/serialization/vaultSerializer.ts) using Zod schema validation for encrypted container envelopes and decrypted vault domains.
  - Implemented [`DexieVaultRepository.ts`](file:///home/krish/Downloads/Coding/vault/src/storage/indexeddb/DexieVaultRepository.ts) providing atomic IndexedDB storage behind the `VaultRepository` port.
  - Implemented [`AppVaultService.ts`](file:///home/krish/Downloads/Coding/vault/src/application/services/AppVaultService.ts) implementing full vault lifecycle (`createVault`, `unlockVault`, `lockVault`, `saveItem`, `deleteItem`, `updateSettings`, `getDecryptedVault`).
  - Implemented interactive Simple Mode UI:
    - [`CreateVaultModal`](file:///home/krish/Downloads/Coding/vault/src/features/onboarding/CreateVaultModal.tsx) with password quality meter and Argon2id initialization.
    - [`UnlockScreen`](file:///home/krish/Downloads/Coding/vault/src/features/unlock/UnlockScreen.tsx) with master password unlock, key unwrap, and error feedback.
    - [`PasswordsScreen`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/PasswordsScreen.tsx) with real-time search, favorite filtering, and list rows.
    - [`PasswordDetailSheet`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/PasswordDetailSheet.tsx) with masked secrets, reveal toggle, auto-clearing clipboard copy, and confirmed deletion.
    - [`AddEditPasswordModal`](file:///home/krish/Downloads/Coding/vault/src/features/passwords/AddEditPasswordModal.tsx) with credential inputs, quick generator, and encrypted atomic saving.
    - [`DashboardScreen`](file:///home/krish/Downloads/Coding/vault/src/features/dashboard/DashboardScreen.tsx) with live item counts and recent logins.
    - [`ProtectedRoute`](file:///home/krish/Downloads/Coding/vault/src/app/routes/ProtectedRoute.tsx) and [`RootRedirect`](file:///home/krish/Downloads/Coding/vault/src/app/routes/ProtectedRoute.tsx) ensuring uninitialized sessions land on Welcome and locked sessions land on Unlock.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 16 test suites / 61 tests) — **PASS** (61/61 tests passing).
  - `npm run lint` (ESLint 9 flat config with 0 warnings) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production bundle) — **PASS** (built in 5.45s).
- **Files changed**:
  - `src/domain/vault/types.ts`
  - `src/security/crypto/SodiumCryptoProvider.ts`
  - `src/security/crypto/SodiumCryptoProvider.test.ts`
  - `src/security/crypto/vaultCrypto.ts`
  - `src/security/crypto/vaultCrypto.test.ts`
  - `src/security/serialization/vaultSerializer.ts`
  - `src/security/serialization/index.ts`
  - `src/storage/indexeddb/DexieVaultRepository.ts`
  - `src/storage/indexeddb/DexieVaultRepository.test.ts`
  - `src/storage/indexeddb/index.ts`
  - `src/application/services/AppVaultService.ts`
  - `src/application/services/AppVaultService.test.ts`
  - `src/application/services/index.ts`
  - `src/app/routes/ProtectedRoute.tsx`
  - `src/app/router.tsx`
  - `src/ui/layout/AppShell.tsx`
  - `src/features/onboarding/CreateVaultModal.tsx`
  - `src/features/onboarding/WelcomeScreen.tsx`
  - `src/features/unlock/UnlockScreen.tsx`
  - `src/features/passwords/AddEditPasswordModal.tsx`
  - `src/features/passwords/PasswordDetailSheet.tsx`
  - `src/features/passwords/PasswordsScreen.tsx`
  - `src/features/passwords/PasswordsScreen.test.tsx`
  - `src/features/dashboard/DashboardScreen.tsx`
  - `test/setup.ts`
  - `vite.config.ts`
  - `playwright.config.ts`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - Key derivation uses Argon2id (64MB memory cost, 2 iterations).
  - Primary vault encryption uses 256-bit XChaCha20-Poly1305 AEAD.
  - Invariant verified: Vault Key is generated independently using CSPRNG and wrapped by Password-Derived Key (PDK).
  - Invariant verified: All item titles, usernames, URLs, and notes are inside the encrypted ciphertext payload; no plaintext metadata is exposed in IndexedDB.
  - Invariant verified: On lock, in-memory decrypted domain is set to null and in-memory key buffer is zeroized (`fill(0)`).
- **Unresolved issues**:
  - None.
- **Recommended next action**:
  - Proceed to **Phase 02 — Secret Generation & Session Safety** (secure password & passphrase generator with entropy estimation, character customization, TOTP secret generation, and clipboard auto-wipe timer).

- **Work completed**:
  - Scaffolded React 19 + TypeScript 5.7 (strict mode with `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) + Vite 6.
  - Configured Tailwind CSS with semantic design tokens in `src/styles/tokens.css` (quiet luxury palette with dark and light themes, zero remote fonts).
  - Built core UI primitives: `Button`, `Input`, `SecretInput` (with reveal and auto-clearing clipboard copy), `Card`, `StatusIndicator`, `Badge`, `ListRow`, `EmptyState`, `Dialog`, `Sheet`, `Toast`.
  - Implemented typed error strategy (`VaultError.ts` and subclasses: `AuthenticationFailedError`, `VaultNotFoundError`, `VaultCorruptedError`, `UnsupportedVaultVersionError`, `MigrationFailedError`, `ImportValidationFailedError`, `StorageQuotaExceededError`, `AttachmentTooLargeError`, `CryptoOperationFailedError`, `RecoveryVerificationFailedError`, `NetworkRestrictedError`).
  - Implemented security-conscious logger (`logger.ts`) with automatic secret key redaction and level filtering.
  - Implemented network guard interceptor (`networkGuard.ts`) for offline-first enforcement.
  - Created architectural port interfaces: `CryptoProvider`, `VaultRepository`, `AttachmentRepository`, `AuditRepository`, `ClipboardPort`, `ClockPort`, `FilePort`, `SecureRandomPort`, `VisibilityPort`.
  - Created web adapters in `src/platform/web/` (`WebClipboardPort`, `SystemClockPort`, `WebSecureRandomPort`, `WebVisibilityPort`, `WebFilePort`).
  - Created application service contracts (`VaultService`, `SessionService`, `SecurityAnalysisService`).
  - Created ephemeral state stores with Zustand (`uiStore.ts` for theme/mode/toasts, `sessionStore.ts` for lock state and auto-lock timeout).
  - Built responsive `AppShell` layout, `WelcomeScreen`, `UnlockScreen`, `DashboardScreen`, `SettingsScreen` (theme, mode, auto-lock timeout), and category view shells.
  - Configured React Router in `src/app/router.tsx`.
  - Configured Vitest, Testing Library, and Playwright test suites.
- **Tests**:
  - `npm run typecheck` (TypeScript strict mode) — **PASS** (0 errors).
  - `npm test` (Vitest with 11 test suites / 38 tests) — **PASS** (38/38 tests passing).
  - `npm run lint` (ESLint flat config with zero warnings allowed) — **PASS** (0 errors, 0 warnings).
  - `npm run build` (Vite production build) — **PASS** (built in 3.35s, bundle 396 kB / gzip 118 kB).
- **Files changed**:
  - `package.json`
  - `tsconfig.json`
  - `vite.config.ts`
  - `tailwind.config.ts`
  - `postcss.config.js`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `eslint.config.js`
  - `index.html`
  - `public/shield.svg`
  - `src/main.tsx`
  - `src/vite-env.d.ts`
  - `src/app/App.tsx`
  - `src/app/router.tsx`
  - `src/styles/tokens.css`
  - `src/styles/globals.css`
  - `src/lib/utils.ts`
  - `src/lib/errors/VaultError.ts`
  - `src/lib/errors/index.ts`
  - `src/lib/errors/VaultError.test.ts`
  - `src/lib/logger/logger.ts`
  - `src/lib/logger/index.ts`
  - `src/lib/logger/logger.test.ts`
  - `src/lib/network/networkGuard.ts`
  - `src/lib/network/index.ts`
  - `src/lib/network/networkGuard.test.ts`
  - `src/security/crypto/CryptoProvider.ts`
  - `src/security/crypto/types.ts`
  - `src/security/crypto/aead.ts`
  - `src/security/crypto/kdf.ts`
  - `src/security/crypto/nonce.ts`
  - `src/security/crypto/random.ts`
  - `src/security/crypto/domain-separation.ts`
  - `src/security/crypto/key-management.ts`
  - `src/security/crypto/index.ts`
  - `src/storage/ports/VaultRepository.ts`
  - `src/storage/ports/AttachmentRepository.ts`
  - `src/storage/ports/AuditRepository.ts`
  - `src/storage/ports/index.ts`
  - `src/storage/indexeddb/db.ts`
  - `src/platform/ports/ClipboardPort.ts`
  - `src/platform/ports/ClockPort.ts`
  - `src/platform/ports/FilePort.ts`
  - `src/platform/ports/SecureRandomPort.ts`
  - `src/platform/ports/VisibilityPort.ts`
  - `src/platform/ports/index.ts`
  - `src/platform/web/WebClipboardPort.ts`
  - `src/platform/web/SystemClockPort.ts`
  - `src/platform/web/WebSecureRandomPort.ts`
  - `src/platform/web/WebVisibilityPort.ts`
  - `src/platform/web/WebFilePort.ts`
  - `src/platform/web/index.ts`
  - `src/domain/vault/types.ts`
  - `src/domain/vault/index.ts`
  - `src/application/services/VaultService.ts`
  - `src/application/services/SessionService.ts`
  - `src/application/services/SecurityAnalysisService.ts`
  - `src/application/services/index.ts`
  - `src/workers/securityScan.worker.ts`
  - `src/workers/crypto.worker.ts`
  - `src/state/uiStore.ts`
  - `src/state/uiStore.test.ts`
  - `src/state/sessionStore.ts`
  - `src/state/sessionStore.test.ts`
  - `src/state/index.ts`
  - `src/ui/primitives/Button.tsx`
  - `src/ui/primitives/Button.test.tsx`
  - `src/ui/primitives/Input.tsx`
  - `src/ui/primitives/Input.test.tsx`
  - `src/ui/primitives/SecretInput.tsx`
  - `src/ui/primitives/SecretInput.test.tsx`
  - `src/ui/primitives/Card.tsx`
  - `src/ui/primitives/StatusIndicator.tsx`
  - `src/ui/primitives/StatusIndicator.test.tsx`
  - `src/ui/primitives/Badge.tsx`
  - `src/ui/primitives/ListRow.tsx`
  - `src/ui/primitives/EmptyState.tsx`
  - `src/ui/primitives/EmptyState.test.tsx`
  - `src/ui/primitives/Dialog.tsx`
  - `src/ui/primitives/Sheet.tsx`
  - `src/ui/primitives/Toast.tsx`
  - `src/ui/primitives/index.ts`
  - `src/ui/layout/AppShell.tsx`
  - `src/ui/layout/AppShell.test.tsx`
  - `src/features/onboarding/WelcomeScreen.tsx`
  - `src/features/unlock/UnlockScreen.tsx`
  - `src/features/dashboard/DashboardScreen.tsx`
  - `src/features/settings/SettingsScreen.tsx`
  - `src/features/passwords/PasswordsScreen.tsx`
  - `src/features/banking/BankingScreen.tsx`
  - `src/features/cards/CardsScreen.tsx`
  - `src/features/identity/IdentityScreen.tsx`
  - `src/features/documents/DocumentsScreen.tsx`
  - `src/features/notes/NotesScreen.tsx`
  - `src/features/security-center/SecurityCenterScreen.tsx`
  - `test/setup.ts`
  - `e2e/app.spec.ts`
  - `aegisvault_ai_buildbook/PROGRESS.md`
- **Security review notes**:
  - No secret material persisted to storage or memory logs.
  - Zero external CDN scripts or remote fonts used.
  - Network guard actively asserts offline-first behavior.
- **Unresolved issues**:
  - None. Stop condition respected: real crypto and vault persistence are intentionally scheduled for Phase 01.
- **Architectural decisions**:
  - D-001 (Architecture Boundaries), D-002 (Storage Ports), D-003 (Crypto Boundary) implemented and verified.
- **Recommended next action**:
  - Proceed to **Phase 01 — Vault Core & Simple Login Vault** (libsodium Argon2id KDF + XChaCha20-Poly1305 AEAD + Dexie IndexedDB atomic repository + simple login item CRUD).

## Decision log

### D-001 — Initial architecture
Decision: UI, application services, domain/security, and storage/platform are separated by explicit interfaces.
Reason: future desktop/mobile portability and security isolation.

### D-002 — Persistence implementation
Decision: use IndexedDB behind repository/storage ports; use Dexie only as an implementation detail.
Reason: browser practicality without coupling business logic to a database API.

### D-003 — Crypto boundary
Decision: all cryptographic operations are wrapped by a narrow crypto service.
Reason: prevent library calls from spreading across the application and make audits/tests possible.
