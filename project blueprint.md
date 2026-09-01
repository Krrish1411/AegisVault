Build a privacy-first, local-first, offline, fully encrypted password manager and personal-data vault called **AegisVault**.

IMPORTANT:
This is a security-sensitive application.

Do NOT invent cryptography.
Do NOT create homemade encryption.
Do NOT use insecure shortcuts.
Do NOT claim the product is unbreakable or impossible to hack.

Use established, well-reviewed cryptographic primitives and libraries only.

The app starts as a browser PWA but must be architected for future desktop and mobile applications.

==================================================
1. PRODUCT PHILOSOPHY
==================================================

AegisVault must be:

- Local-first
- Offline-first
- Privacy-first
- Zero-knowledge by design
- No account required
- No backend
- No cloud sync
- No telemetry
- No analytics
- No crash reporting
- No advertising
- No tracking
- No external fonts
- No CDN runtime dependencies
- No third-party runtime scripts
- No network request by default

The user's vault must remain under the user's control.

Security description:

"Uses modern, industry-standard cryptography designed to make offline brute-force attacks computationally impractical when a strong master password is used."

Never claim:
- unbreakable
- impossible to decrypt
- impossible to hack
- absolutely secure
- military-grade as an absolute guarantee

==================================================
2. PLATFORM STRATEGY
==================================================

PHASE 1:
Build as a React/TypeScript PWA.

Recommended stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- IndexedDB
- libsodium / libsodium-wrappers

Use browser APIs where appropriate.

PHASE 2:
Prepare architecture for desktop using Tauri 2.

PHASE 3:
Prepare architecture for Android/iOS using Capacitor or appropriate native integrations.

Future native versions should use:

- OS Keychain
- Android Keystore
- secure hardware-backed storage where available
- native biometric authentication

Do not implement custom biometric cryptography.

Business logic must remain independent from the storage/platform layer.

==================================================
3. TWO UI/UX MODES
==================================================

Provide two modes.

------------------------------
SIMPLE MODE
------------------------------

Default for new users.

Designed for non-technical users.

Use plain language and minimal choices.

Main navigation:

- Passwords
- Bank
- Cards
- IDs
- Documents
- Secure Notes
- Security Center
- Search
- Settings
- Lock

Hide advanced cryptographic terminology.

------------------------------
ADVANCED MODE
------------------------------

For experienced users.

Provide:

- Multiple vaults
- Nested folders
- Custom fields
- Custom item types
- TOTP
- API keys
- SSH keys
- Crypto wallets
- Advanced backups
- Advanced sharing
- Security diagnostics
- Encryption information
- Detailed settings

Users can switch between modes.

IMPORTANT:

Simple Mode and Advanced Mode must use exactly the same underlying security architecture.

Changing UI mode must NEVER weaken encryption.

==================================================
4. SECURITY CENTER
==================================================

Create a dedicated Security Center.

All analysis must happen locally.

Show:

- Overall security status
- Weak passwords
- Reused passwords
- Old passwords
- Common passwords
- Password health
- Backup status
- Recovery status
- Auto-lock status
- Recovery verification date
- Last local security scan
- Application version
- Vault format version
- Crypto configuration summary in Advanced Mode

Example:

Vault Protected

42 items
3 weak passwords
2 reused passwords
4 old passwords
Recovery: Verified
Backup: Available
Auto-lock: 5 minutes

Provide simple actions:

- Fix weak passwords
- Review reused passwords
- Create backup
- Verify recovery
- Review security settings

==================================================
5. EXPLICIT THREAT MODEL
==================================================

Create a visible security documentation page.

Explain what AegisVault protects against.

PROTECTED / DESIGNED TO RESIST:

- Stolen encrypted backup files
- Unauthorized access to IndexedDB
- Offline password guessing
- Backup tampering
- Storage-provider access to encrypted data
- Network interception when network features are used
- Accidental metadata exposure inside the encrypted vault

LIMITATIONS:

AegisVault cannot fully protect against:

- Malware on the device
- A malicious browser extension
- A compromised operating system
- A compromised browser
- Keyloggers
- Someone watching the master password being entered
- Someone obtaining the unlocked device
- Future unknown vulnerabilities
- Malicious or compromised application updates

Display this in simple language.

Do not frighten beginners unnecessarily.

==================================================
6. LOCAL PASSWORD HEALTH ENGINE
==================================================

Build a completely local password health engine.

No external breach API by default.

Analyze:

- weak passwords
- short passwords
- reused passwords
- duplicate passwords
- old passwords
- common passwords
- predictable patterns

Never upload passwords.

Where practical, use a local common/compromised-password dataset.

All analysis must happen locally.

==================================================
7. OPTIONAL BREACH CHECK
==================================================

Support a future optional internet breach check.

Requirements:

- OFF by default
- Explicit opt-in
- Clear privacy explanation
- Never send plaintext passwords
- Never send the full password hash
- Use a privacy-preserving k-anonymity approach where appropriate
- Clearly show that internet access is required

Default AegisVault behavior remains completely offline.

==================================================
8. CORE DATA TYPES
==================================================

Support:

- Website passwords
- Application passwords
- Email accounts
- Social accounts
- Bank logins
- Bank accounts
- Bank profiles
- Credit cards
- Debit cards
- UPI
- UPI PIN
- ATM PIN
- PAN
- Aadhaar
- Passport
- Driving licence
- Voter ID
- Tax IDs
- Insurance
- Secure notes
- TOTP
- API keys
- SSH keys
- License keys
- Crypto wallet seeds
- Private keys
- Emergency contacts
- Documents
- Attachments
- Custom records

==================================================
9. VAULT ORGANIZATION
==================================================

Support:

- One main vault
- Multiple vaults
- Folders
- Nested folders
- Tags
- Favorites
- Archive
- Search
- Sorting
- Filtering

Example vaults:

- Personal
- Banking
- Family
- Crypto
- Work
- Documents
- Secrets

Structure:

Vault
 → Folder
   → Subfolder
     → Item
       → Fields
       → Attachments

==================================================
10. ITEM TYPES
==================================================

Built-in types:

- login
- email
- application
- bank_login
- bank_account
- bank_profile
- debit_card
- credit_card
- upi
- upi_pin
- atm_pin
- identity
- passport
- driving_license
- pan
- aadhaar
- voter_id
- tax_id
- insurance
- secure_note
- totp
- api_key
- ssh_key
- license_key
- wallet_seed
- private_key
- emergency_contact
- document
- custom

Allow custom fields.

==================================================
11. PERSONAL IDENTITY DATA
==================================================

Identity fields:

- Full name
- First name
- Middle name
- Last name
- Date of birth
- Phone
- Alternate phone
- Email
- Alternate email
- Address
- City
- State
- Country
- Postal code
- Notes

PAN:

- PAN number
- Name
- Date of birth
- Notes

Aadhaar:

- Aadhaar number
- Name
- Date of birth
- Address
- Notes

Passport:

- Passport number
- Name
- Date of birth
- Nationality
- Issue date
- Expiry date
- Place of issue
- Notes

Driving licence:

- Licence number
- Name
- Date of birth
- Issue date
- Expiry date
- Issuing authority
- Vehicle/category
- Notes

Voter ID:

- EPIC number
- Name
- Date of birth
- Address
- Constituency
- Notes

Generic identity/document:

- Document type
- Document number
- Issuing authority
- Issue date
- Expiry date
- Notes

==================================================
12. BANKING DATA
==================================================

Bank account:

- Bank name
- Account holder
- Account number
- Account type
- IFSC
- Branch
- Branch address
- Customer ID
- CIF number
- MICR
- SWIFT
- IBAN
- UPI ID
- UPI PIN
- ATM PIN
- Notes

Account types:

- Savings
- Current
- Salary
- NRE
- NRO
- Other

Bank login:

- Website
- Username
- Password
- Customer ID
- Login PIN
- Security questions
- Notes

Hide sensitive values by default.

==================================================
13. CARDS
==================================================

Card fields:

- Cardholder name
- Card nickname
- Card number
- Credit/debit
- Bank
- Expiry month
- Expiry year
- CVV
- PIN
- Billing address
- Credit limit
- Statement date
- Payment due date
- Rewards information
- Notes

Hide sensitive fields by default.

==================================================
14. PASSWORD GENERATOR
==================================================

Build a secure password generator.

Maximum length:

128 characters.

Supported range:

12–128 characters

Default:

20 characters.

Modes:

- Secure password
- Passphrase
- PIN
- Pronounceable
- Custom

Password options:

- lowercase
- uppercase
- numbers
- symbols
- custom character set
- exclude ambiguous characters
- exclude similar characters
- minimum character counts

Use cryptographically secure randomness only.

Never use Math.random().

==================================================
15. PASSPHRASE GENERATOR
==================================================

Provide dedicated passphrase generation.

Word counts:

- 4
- 5
- 6
- 7
- 8
- 10

Options:

- separator
- capitalization
- numbers
- symbols

Example:

river-lamp-orbit-cactus-mirror

Use cryptographically secure randomness.

==================================================
16. PASSWORD HISTORY
==================================================

Support encrypted password history.

Allow:

- View previous password
- Restore previous password
- Delete password history

Never store password history plaintext.

==================================================
17. MASTER PASSWORD
==================================================

The master password must never be stored.

Never store it in:

- localStorage
- IndexedDB
- URLs
- logs
- analytics
- telemetry

Use it only for key derivation.

Recommend:

- minimum 16 characters
- strongly recommend 25+ characters
- strong random passphrase

Do not force arbitrary complexity rules when a strong passphrase is used.

==================================================
18. CRYPTOGRAPHIC ARCHITECTURE
==================================================

Use envelope encryption.

Generate a random 256-bit Vault Encryption Key.

Generate it using a cryptographically secure random generator.

Use:

XChaCha20-Poly1305-IETF

through libsodium.

Use authenticated encryption.

The Vault Key encrypts vault data.

Never derive the Vault Key directly from the master password.

Architecture:

Master Password
 ↓
Argon2id
 ↓
Password-Derived Key
 ↓
Wrap Vault Key

Random Vault Key
 ↓
Encrypt Vault Data

Use separate cryptographic contexts/domain separation where appropriate.

Never reuse a nonce.

Never use custom encryption.

==================================================
19. ARGON2ID
==================================================

Use Argon2id.

Requirements:

- unique random salt
- configurable memory cost
- configurable time cost
- configurable parallelism
- reasonable browser benchmark during setup

Target a secure but usable unlock duration.

Store the KDF parameters needed to unlock the vault.

Design parameters to be upgradeable later.

Do not blindly use an extreme fixed setting that makes mobile/browser use unusable.

==================================================
20. KEY ROTATION AND CRYPTO UPGRADE PATH
==================================================

Design the vault for future cryptographic upgrades.

Every vault must include a crypto/format version.

Example:

Vault Format v1
Crypto Profile v1

Future:

Vault Format v2
Crypto Profile v2

Support migration.

When security parameters need to change:

1. Unlock vault.
2. Decrypt the Vault Key using the current wrapping method.
3. Generate or derive the new required key material.
4. Re-wrap the Vault Key using the stronger/new mechanism.
5. Re-encrypt data if the encryption scheme itself changes.
6. Write the new version atomically.
7. Preserve the old vault until the migration succeeds.

Never destroy the old vault before successful migration.

Support:

- KDF parameter upgrades
- crypto algorithm upgrades
- key wrapping upgrades
- vault format upgrades

Users should not need to recreate their vault.

==================================================
21. KEY SEPARATION
==================================================

Do not use the same key for unrelated purposes.

Use separate derived/wrapped keys for:

- Vault encryption
- Master-password wrapping
- Recovery wrapping
- Future sharing keys
- Attachment encryption where appropriate

Use explicit domain separation/context strings.

==================================================
22. RECOVERY ARCHITECTURE
==================================================

Generate a cryptographically secure recovery secret.

Represent it as a 24-word BIP39 mnemonic.

Respect the BIP39 specification rather than inventing a custom word-processing scheme.

Use an independent recovery wrapping key.

Architecture:

Recovery Secret
 ↓
Recovery Key Derivation
 ↓
Recovery Wrapping Key
 ↓
Wrap Vault Key

Master-password recovery and recovery-phrase recovery must be independent.

==================================================
23. RECOVERY UX
==================================================

During setup:

Display clearly:

"If you lose both your master password and recovery phrase, access to your vault may be permanently lost."

Require confirmation.

Show the recovery phrase.

Ask the user to re-enter 3 randomly selected words.

Do not allow setup completion until correct.

Never store the recovery phrase plaintext.

Never log it.

Never send it anywhere.

==================================================
24. RECOVERY VERIFICATION SCHEDULE
==================================================

After initial recovery setup:

- Verify recovery phrase immediately

Then remind the user:

- Every 3 months initially
- Then every 6 months

Allow the user to change reminder preferences.

Do not automatically reveal the recovery phrase.

Verification flow:

1. Require master-password authentication.
2. Explain the verification.
3. Ask for selected random words.
4. Verify locally.
5. Record only the verification status/date.
6. Never store the phrase.

Display:

Recovery
✓ Verified
Last verified: 4 months ago

Never store the actual recovery phrase in the verification history.

==================================================
25. OPTIONAL RECOVERY PASSPHRASE
==================================================

Support BIP39 passphrase.

Clearly warn:

"Losing your recovery passphrase may make recovery impossible."

Never store it plaintext.

==================================================
26. LOCAL STORAGE SECURITY
==================================================

IndexedDB must contain only encrypted vault data plus the minimum metadata absolutely required for unlocking.

Do not store plaintext:

- passwords
- usernames
- URLs
- item titles
- folder names
- vault names
- notes
- tags
- bank data
- card data
- identity data
- document contents
- sensitive metadata

Do not create permanent plaintext search indexes.

==================================================
27. MEMORY SECURITY
==================================================

Decrypted data exists only while the vault is unlocked.

On lock:

- clear decrypted application state
- release active cryptographic keys where practical
- clear sensitive temporary state
- clear clipboard contents created by the application where supported

Do not falsely claim browser memory can be perfectly wiped.

Minimize the lifetime of sensitive data in memory.

==================================================
28. AUTO LOCK
==================================================

Options:

- 1 minute
- 5 minutes
- 10 minutes
- 15 minutes
- 30 minutes
- Never

Default:

5 minutes.

Lock on:

- inactivity
- manual lock
- appropriate visibility changes
- native app backgrounding

==================================================
29. CLIPBOARD
==================================================

Sensitive copy actions:

- Explicit user action only
- Default clear after 20 seconds
- Configurable 10/20/30/60 seconds
- Optional countdown

Never log clipboard contents.

==================================================
30. DOCUMENT VAULT
==================================================

Support encrypted documents.

Examples:

- Passport scans
- Aadhaar scans
- PAN cards
- Driving licences
- Insurance documents
- Certificates
- Property documents
- Tax documents
- Contracts
- Receipts

Support:

- PDF
- JPG
- PNG
- WEBP
- TXT
- reasonable document formats

All contents must be encrypted.

For large files use authenticated streaming encryption such as libsodium secretstream.

==================================================
31. ATTACHMENT LIMITS
==================================================

Prevent accidental huge files.

Initial limits:

- Maximum single attachment: 50 MB
- Recommended total vault attachment target: 500 MB

Show:

Documents:
183 MB / 500 MB

Warn before large imports.

Do not assume every browser supports unlimited storage.

Detect storage limitations where possible.

Make limits configurable by platform in the future.

Native desktop/mobile versions may support larger limits.

==================================================
32. SECURE NOTES
==================================================

Support:

- title
- text
- category
- tags
- attachments
- checklist
- important flag

Encrypt all note contents and metadata.

==================================================
33. TOTP
==================================================

Support TOTP.

Fields:

- issuer
- account
- secret
- algorithm
- digits
- period

Features:

- current code
- countdown
- copy
- encrypted secret storage

Never transmit TOTP secrets.

==================================================
34. CRYPTO WALLET
==================================================

Fields:

- wallet name
- blockchain/network
- wallet address
- derivation path
- recovery phrase
- optional passphrase
- private key
- notes
- created date
- last verified date

Support BIP39:

- 12 words
- 15 words
- 18 words
- 21 words
- 24 words

Validate BIP39 checksum.

Hide seed phrases by default.

==================================================
35. EMERGENCY KIT
==================================================

Create a local emergency kit.

Allow user-selected information.

Provide printable instructions.

Never automatically expose every secret.

==================================================
36. FAMILY SHARING
==================================================

No cloud sharing.

Support manual encrypted sharing.

Allow:

- encrypted vault export
- encrypted folder export
- selected-item export
- encrypted family import

Roles:

- owner
- admin
- member
- view_only
- restricted

Never require sharing the master password.

Future multi-device sharing should use public-key cryptography with independent user/device keys.

==================================================
37. ENCRYPTED EXPORT / IMPORT
==================================================

Export must be encrypted.

Support:

- full vault
- selected vault
- selected folder
- selected items
- family share
- emergency kit

Use authenticated encryption.

Container should contain:

- format version
- crypto profile/version
- KDF algorithm
- KDF parameters
- salts
- nonce information
- wrapped Vault Key
- encrypted data
- authentication information
- minimal required metadata

Do not rely on a plain checksum as the security mechanism.

Authenticated encryption must detect tampering.

==================================================
38. VAULT FORMAT VERSIONING
==================================================

Every vault/export must have explicit versioning.

Example:

{
  formatVersion: 1,
  cryptoVersion: 1
}

Future versions may become:

formatVersion: 2
cryptoVersion: 2

Implement migration handlers.

Never silently interpret an unknown format.

If a newer unsupported vault is opened:

"Your AegisVault version cannot safely open this vault."

Never attempt destructive conversion.

==================================================
39. BACKUP VERSIONING
==================================================

Support multiple backups locally.

Allow:

- create backup
- inspect backup
- restore backup
- delete backup
- verify backup
- detect corruption

Never silently overwrite the active vault.

==================================================
40. PWA OFFLINE UPDATE STRATEGY
==================================================

The PWA must work completely offline after installation.

Use a service worker for application caching.

Requirements:

- Cache application assets locally
- No runtime CDN dependencies
- No runtime third-party scripts
- No mandatory internet access
- Existing vault must remain usable offline

Security-sensitive update behavior:

Do NOT silently replace the running application with an unknown update.

When a new version is available:

Show:

"New AegisVault version available."

Allow the user to review/install the update.

After update:

- verify application version
- migrate vault format only when necessary
- preserve existing vault
- fail safely if migration fails

Never require an internet connection simply to unlock an existing vault.

Do not fetch remote code dynamically.

==================================================
41. SEARCH
==================================================

Search locally while unlocked.

Search:

- titles
- usernames
- URLs
- tags
- notes
- custom fields

Do not create permanent plaintext indexes.

==================================================
42. AUDIT LOG
==================================================

Keep an encrypted local audit log.

Possible events:

- item created
- item edited
- item deleted
- vault unlocked
- vault locked
- backup created
- backup restored
- password changed
- recovery used
- recovery verified
- security scan completed
- crypto migration completed

Never store secret values.

==================================================
43. DUress / HIDDEN VAULT
==================================================

Optional feature.

If implemented, carefully ensure normal application behavior does not accidentally leak protected-vault existence or contents.

Do not claim forensic-level plausible deniability unless genuinely supported.

==================================================
44. SECURE DELETE
==================================================

Support:

- delete item
- delete folder
- delete vault
- destroy local vault

Warn:

"Browser storage deletion does not guarantee forensic erasure from every underlying storage medium."

Never claim guaranteed secure deletion on the web.

==================================================
45. UI — SIMPLE MODE
==================================================

Main screens:

1. Welcome
2. Create Vault
3. Recovery Setup
4. Unlock
5. Dashboard
6. Search
7. Passwords
8. Bank
9. Cards
10. IDs
11. Documents
12. Secure Notes
13. Security Center
14. Settings
15. Lock

Use simple wording.

==================================================
46. UI — ADVANCED MODE
==================================================

Screens:

1. Welcome
2. Create Vault
3. Recovery Setup
4. Unlock
5. Dashboard
6. Vault Manager
7. Folder Manager
8. Search
9. Item Details
10. Password Generator
11. Passphrase Generator
12. Password Health
13. Security Center
14. Documents
15. Secure Notes
16. TOTP
17. Wallet
18. Family Sharing
19. Emergency Kit
20. Backup/Restore
21. Security Diagnostics
22. Crypto/Format Information
23. Settings
24. Lock

==================================================
47. UX PRINCIPLES
==================================================

Simple Mode:

- Plain language
- Clear actions
- Minimal choices
- Sensible defaults
- Helpful explanations
- Minimal technical terminology

Advanced Mode:

- Detailed controls
- Detailed diagnostics
- Multiple vaults
- Custom fields
- Crypto information
- Advanced backup controls
- Security information

Both modes must provide identical underlying security.

==================================================
48. SECURITY WARNINGS
==================================================

Use clear warnings at important points.

Recovery:

"Your recovery phrase is your emergency backup. Store it somewhere safe and offline."

Password loss:

"If you lose both your master password and recovery phrase, access to your vault may be permanently lost."

Seed phrase:

"Never share this recovery phrase with anyone."

Breach check:

"This feature requires internet access."

Large attachment:

"This file is large and may use significant browser storage."

Vault deletion:

"Deleting this vault may permanently destroy access to your data."

==================================================
49. WEB HARDENING
==================================================

Use:

- HTTPS
- strict Content Security Policy
- frame restrictions
- secure referrer policy
- MIME sniffing protection
- appropriate Permissions Policy

Avoid:
- third-party runtime JavaScript
- remote fonts
- remote CSS
- analytics scripts
- tracking pixels

==================================================
50. DEPENDENCY SECURITY
==================================================

Minimize dependencies.

Use mature security libraries.

Do not implement cryptography manually.

Lock dependency versions.

Document security-critical dependencies.

Regularly review dependencies for vulnerabilities.

==================================================
51. SECURITY TESTING
==================================================

Create automated tests for:

- encryption/decryption
- authentication failure
- tampered ciphertext
- wrong password
- wrong recovery phrase
- corrupted backup
- nonce uniqueness
- random key generation
- password generator
- passphrase generator
- backup restore
- lock/unlock
- clipboard timeout
- recovery verification
- migration
- format version handling
- attachment encryption
- attachment limits
- offline behavior
- PWA update behavior

Verify:

- no plaintext secrets in IndexedDB
- no plaintext secrets in localStorage
- no plaintext secrets in logs
- no secrets in URLs
- no unexpected network requests
- decryption fails safely
- migration cannot destroy the original vault on failure

==================================================
52. DEVELOPMENT ARCHITECTURE
==================================================

Use:

UI
↓
Application Services
↓
Vault/Security Services
↓
Storage Adapter
↓
IndexedDB / Native Secure Storage

Crypto must be isolated in dedicated modules.

Business logic must not directly manipulate storage.

Storage must be abstracted so IndexedDB can later be replaced with native secure storage.

Create dedicated modules for:

- crypto
- key management
- KDF
- vault format
- migration
- recovery
- backup
- attachments
- password generator
- security analysis
- storage

==================================================
53. FUTURE DESKTOP / MOBILE
==================================================

Desktop:

- Tauri 2
- OS secure storage
- native clipboard handling
- native biometrics
- secure file access

Mobile:

- Capacitor or native integration
- Keychain/Keystore
- biometrics
- secure app lifecycle handling
- native secure storage

Do not weaken the cryptographic architecture during migration.

==================================================
54. MVP BUILD ORDER
==================================================

PHASE 1:

- Simple Mode
- Create vault
- Master password
- Random 256-bit Vault Key
- Argon2id
- XChaCha20-Poly1305
- IndexedDB encrypted storage
- Lock/unlock
- Add/edit/delete passwords

PHASE 2:

- Password generator
- 128-character maximum
- Passphrase generator
- PIN generator
- Clipboard protection
- Auto-lock
- Sensitive field protection

PHASE 3:

- Recovery phrase
- Recovery confirmation
- Recovery verification schedule
- Recovery unlock
- Change master password
- Encrypted export/import

PHASE 4:

- Security Center
- Local password health
- Weak/reused/old password detection
- Backup status
- Recovery status

PHASE 5:

- Folders
- Multiple vaults
- Search
- Tags
- Favorites
- Password history

PHASE 6:

- Bank
- Cards
- Identity
- Government IDs
- Insurance
- Emergency contacts

PHASE 7:

- Documents
- Encrypted attachments
- Attachment limits
- Secure notes

PHASE 8:

- TOTP
- Crypto wallet
- BIP39 validation
- Printable recovery materials

PHASE 9:

- Family sharing
- Emergency Kit
- Optional duress vault
- Optional privacy-preserving breach check

PHASE 10:

- Vault migration
- Crypto upgrade path
- Format versioning
- PWA update hardening

PHASE 11:

- Tauri desktop
- Native secure storage
- Native biometrics
- Capacitor/mobile support

==================================================
55. FINAL ACCEPTANCE CRITERIA
==================================================

The app must:

- Work fully offline
- Require no account
- Require no backend
- Require no cloud sync
- Make no network requests by default
- Store no plaintext secrets persistently
- Never store the master password
- Never store the recovery phrase plaintext
- Use cryptographically secure randomness
- Use authenticated encryption
- Detect tampering
- Use Argon2id
- Use a random 256-bit Vault Key
- Use envelope encryption
- Support key rotation
- Support crypto upgrades
- Support vault format migrations
- Support encrypted export/import
- Support backup versioning
- Support passwords up to 128 characters
- Support secure passphrases
- Support PIN generation
- Support TOTP
- Support bank information
- Support cards
- Support personal identity
- Support government IDs
- Support secure notes
- Support encrypted documents
- Support encrypted attachments
- Enforce attachment limits
- Support wallet recovery phrases
- Support Security Center
- Support local password health
- Support optional privacy-preserving breach checking
- Support Simple Mode
- Support Advanced Mode
- Support recovery verification reminders
- Support threat-model documentation
- Support PWA offline operation
- Support controlled application updates
- Auto-lock
- Protect clipboard
- Hide sensitive fields by default
- Fail safely during migration
- Never destroy the existing vault before successful migration
- Remain suitable for future desktop and mobile applications

==================================================
56. CRITICAL SECURITY RULES
==================================================

NEVER:

- invent cryptography
- use homemade encryption
- use Math.random() for secrets
- reuse nonces
- store secrets plaintext
- put secrets in URLs
- put secrets in logs
- send secrets to external services
- use runtime CDN scripts
- silently weaken encryption
- silently migrate vaults destructively
- automatically overwrite a valid vault during migration
- claim absolute security
- claim browser memory can be perfectly erased
- claim browser secure deletion is guaranteed
- claim the app is unbreakable

ALWAYS:

- use established cryptographic primitives
- use mature security libraries
- use authenticated encryption
- use cryptographically secure randomness
- use unique salts
- use unique nonces
- use key separation
- minimize plaintext lifetime
- minimize metadata leakage
- validate imported data
- fail closed on authentication/decryption failure
- test security-sensitive functionality
- preserve old vault data until successful migration
- make security upgrades possible
- make Simple Mode and Advanced Mode cryptographically identical
- keep privacy as the default
- require explicit consent for internet features

Build incrementally.

Security takes priority over convenience.

Do not silently make security weaker just to simplify implementation.
