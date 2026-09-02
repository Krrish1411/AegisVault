# AegisVault - Project Blueprint

## Product Vision

AegisVault is a **privacy-first, local-first** password manager and secure personal-data vault. The application runs entirely in the user's browser as a Progressive Web App (PWA), works fully offline, and requires no accounts, backend services, cloud databases, or network connectivity for core functionality. User data remains local by default.

### Core Principles

- **Local-First**: All data stored locally in IndexedDB; no cloud sync by default
- **Privacy-First**: No telemetry, analytics, crash reporting, advertising, tracking, or third-party runtime scripts
- **Offline-Capable**: Full functionality without internet access after initial PWA installation
- **Open Source**: Transparent, auditable codebase
- **Security by Design**: Cryptographic operations follow established best practices; never invent custom cryptography

---

## Platform Strategy

### Phase Priority

1. **Head 1: Web/PWA** (Current focus) - Complete, production-ready browser application
2. **Head 2: Desktop** - Tauri 2 adaptation after Head 1 is complete and audited
3. **Head 3: Mobile** - Capacitor or native integration after Head 1 is complete and audited
4. **Head 4: Advanced Security** - Future enhancements (HSM support, hardware key integration, etc.)
5. **Head 5: Product/Business** - Distribution, documentation, community building

**Rule**: Do not optimize for desktop/mobile during web development. Complete Head 1 first.

---

## Technology Stack (Web/PWA)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Vanilla TypeScript or minimal framework | Avoid heavy dependencies; maintain auditability |
| Build Tool | Vite | Fast, modern, minimal runtime overhead |
| Package Manager | npm/pnpm | Standard tooling |
| Storage | IndexedDB | Browser-native persistent storage |
| Crypto | libsodium (via libsodium-wrappers or similar) | Industry-standard, audited cryptographic library |
| UI | Custom or minimal component library | Control over security-sensitive rendering |
| PWA | Native Service Worker API | Offline caching, update control |
| State Management | Minimal/custom | Avoid complexity; maintain transparency |

### Dependency Philosophy

- Minimize runtime dependencies
- No CDN-hosted runtime code
- No external fonts requiring network requests
- Pin all dependency versions
- Prefer small, auditable libraries over large frameworks

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AegisVault PWA                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   UI Layer  │  │  Auth Layer │  │   Crypto Layer      │  │
│  │  (Simple/   │  │  (Unlock/   │  │  (libsodium, XChaCha│  │
│  │   Advanced) │  │   Lock)     │  │   20-Poly1305,      │  │
│  └─────────────┘  └─────────────┘  │    Argon2id)        │  │
│                                     └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Vault Engine                            │ │
│  │  (Encryption/Decryption, Key Management, Versioning)    │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Data Models │  │  Generator  │  │   Health Engine     │  │
│  │ (Items,     │  │  (Passwords,│  │   (Weak/Reused/     │  │
│  │  Folders,   │  │  Passphrases│  │    Common checks)   │  │
│  │  Tags)      │  │  , PINs)    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Backup/   │  │  Recovery   │  │   Attachment        │  │
│  │   Export    │  │  (BIP39     │  │   Handler           │  │
│  │             │  │  Mnemonic)  │  │  (Streaming Encrypt)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              IndexedDB (Encrypted Storage)              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Major Modules

### 1. Authentication & Session Management
- Master password entry
- Argon2id key derivation
- Session timeout / auto-lock
- Clipboard clearing on lock

### 2. Cryptographic Core
- XChaCha20-Poly1305-IETF authenticated encryption
- Envelope encryption architecture
- Key wrapping/unwrapping
- Nonce/salt generation
- Crypto format versioning

### 3. Vault Engine
- Vault creation/opening
- Item CRUD operations
- Folder/nested folder management
- Tag system
- Search indexing (encrypted)

### 4. Data Models
- Password/Login records
- Financial records (bank accounts, cards, UPI, ATM PINs)
- Identity documents (PAN, Aadhaar, Passport, DL, Voter ID, Tax IDs)
- Secure notes
- TOTP secrets
- API keys, SSH keys, license keys
- Crypto wallet recovery phrases/private keys
- Custom record types
- Encrypted document attachments

### 5. Password Generator
- Secure random passwords (12-128 characters)
- Passphrase generation with configurable options
- PIN generation
- Uses CSPRNG only (never Math.random())

### 6. Password Health Engine
- Weak password detection
- Reuse/duplicate detection
- Common/predictable pattern detection
- Optional k-anonymity breach checking (disabled by default)

### 7. Backup & Export
- Encrypted, authenticated exports
- Versioned format
- Tamper detection
- Import validation

### 8. Recovery System
- BIP39 24-word mnemonic generation
- Independent recovery key wrapping
- Confirmation workflow with word verification
- Periodic reminder system

### 9. PWA & Update System
- Service worker for offline caching
- Controlled update mechanism
- Safe migration on version changes
- No remote code execution

---

## Security Architecture

### Key Hierarchy

```
Master Password
       │
       ▼
  Argon2id KDF (with random salt)
       │
       ▼
Password-Derived Key (wrapping key)
       │
       ▼
  ┌────┴────┐
  │  Wrap   │
  └────┬────┘
       │
       ▼
Vault Encryption Key (256-bit random)
       │
       ▼
  Encrypt Vault Data (XChaCha20-Poly1305-IETF)
```

### Cryptographic Specifications

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| KDF | Argon2id | Memory: 64MB+, Iterations: 3+, Parallelism: 4+ |
| Encryption | XChaCha20-Poly1305-IETF | 256-bit key, 192-bit nonce |
| Vault Key | Random bytes | 256 bits from CSPRNG |
| Salt | Random bytes | 128 bits minimum |
| Nonce | Random bytes | Per-operation unique |

### Envelope Encryption

1. Generate random 256-bit Vault Key
2. Derive wrapping key from Master Password using Argon2id
3. Wrap (encrypt) Vault Key with wrapping key
4. Store wrapped Vault Key + salt + KDF params in vault header
5. Use Vault Key to encrypt all vault data

**Benefit**: Changing master password only requires re-wrapping the Vault Key, not re-encrypting all data.

### Key Separation

- Separate keys for different purposes (data encryption, HMAC, attachment encryption)
- Domain separation labels in key derivation
- Never reuse keys across contexts

---

## Storage Model

### IndexedDB Structure

```
aegisvault-db/
├── vault-header/           # Encrypted metadata, KDF params, wrapped vault key
├── vault-data/             # Encrypted items, folders, tags
├── attachments/            # Encrypted file blobs (streaming encrypted)
└── metadata/               # Non-sensitive app state, settings
```

### What Must NOT Be Stored Plaintext

- Passwords, usernames, URLs
- Item names, folder names, vault names
- Notes, tags
- Bank/card/identity data
- Document contents
- Any secret material

### Acceptable Plaintext Metadata

- Record IDs (UUIDs)
- Timestamps (created, modified)
- Record type identifiers
- Encrypted blob sizes
- Schema/format version numbers

---

## UI Modes

### Simple Mode
- Streamlined interface for beginners
- Essential features prominently displayed
- Guided workflows for common tasks
- Reduced visual complexity

### Advanced Mode
- Full feature access
- Custom field management
- Advanced search filters
- Technical details visible

**Critical**: Both modes use identical underlying security. Mode affects UI only.

---

## Backup & Recovery Direction

### Backup Format
- Versioned container format
- Authenticated encryption
- Includes schema version for migration
- Tamper-detecting MAC

### Recovery Mechanism
- BIP39 24-word mnemonic (cryptographically secure)
- Independent from master password
- Used to wrap/protect Vault Key backup
- Setup requires confirmation + 3-word verification
- Periodic reminder (~6 months default)

---

## Desktop/Mobile Adaptation (Future)

### Desktop (Tauri 2)
- Wrap web application in Tauri shell
- Replace IndexedDB with SQLite or file-based storage
- Access to OS keychain (optional)
- System tray integration
- Auto-update with signature verification

### Mobile (Capacitor/Native)
- Wrap web application
- Biometric authentication integration
- Secure enclave/keychain usage
- Background app protection
- Share extension for password capture

**Note**: These adaptations occur AFTER Head 1 is complete and audited.

---

## Phased Roadmap

### Phase 0: Foundation (Current)
- [x] Repository inspection
- [x] Architecture documentation
- [x] Security model definition
- [x] Decision logging setup
- [ ] Project scaffolding ready for development

### Head 1: Web/PWA Development
- **Phase 1.1**: Project initialization (Vite, TypeScript, basic structure)
- **Phase 1.2**: Crypto layer implementation (libsodium integration, key hierarchy)
- **Phase 1.3**: Vault engine core (creation, opening, envelope encryption)
- **Phase 1.4**: Data models and storage (IndexedDB schema, CRUD operations)
- **Phase 1.5**: Authentication flow (unlock, lock, session management)
- **Phase 1.6**: UI foundation (Simple/Advanced mode framework, navigation)
- **Phase 1.7**: Password generator (secure generation, passphrase support)
- **Phase 1.8**: Item management (CRUD UI, folders, tags)
- **Phase 1.9**: Search functionality (encrypted index, filtering)
- **Phase 1.10**: Password health engine (weak/reuse detection)
- **Phase 1.11**: Recovery system (BIP39 mnemonic, verification workflow)
- **Phase 1.12**: Backup/export/import (encrypted format, validation)
- **Phase 1.13**: Attachment handling (streaming encryption, limits)
- **Phase 1.14**: PWA configuration (service worker, offline caching)
- **Phase 1.15**: Security hardening & audit preparation
- **Phase 1.16**: Testing & bug fixes
- **Phase 1.17**: Documentation & release preparation

### Head 2: Desktop (After Head 1 Audit)
### Head 3: Mobile (After Head 1 Audit)
### Head 4: Advanced Security (Future)
### Head 5: Product/Business (Future)

---

## Compliance & Standards

- Follow BIP39 specification exactly for recovery mnemonics
- Use libsodium APIs as documented; no modifications
- Adhere to Web Crypto API standards where applicable
- Follow OWASP guidelines for web application security
- Implement defense-in-depth strategies

---

## Out of Scope (Explicitly Not Building)

- Backend services or APIs
- Cloud synchronization
- User accounts or authentication servers
- Email/SMS notifications
- Telemetry, analytics, crash reporting
- Advertising or tracking
- Network-dependent features for core functionality

---

*Last Updated: Phase 0 - Initial Architecture*
