# AegisVault - Security Model

## Overview

This document defines the security architecture, threat model, trust boundaries, and cryptographic specifications for AegisVault. Security is a core product requirement, not an afterthought.

---

## Threat Model

### Assets to Protect

1. **Vault Data**: All encrypted user secrets (passwords, financial data, identity documents, keys, notes, attachments)
2. **Vault Encryption Key**: The 256-bit key used to encrypt vault data
3. **Master Password**: User's authentication secret (never stored)
4. **Recovery Mnemonic**: BIP39 24-word phrase for vault recovery
5. **User Privacy**: No metadata leakage about what secrets are stored

### Threat Actors

| Actor | Capability | Goal |
|-------|------------|------|
| Passive Network Attacker | Can observe network traffic | Intercept secrets during sync (if enabled in future) |
| Active Network Attacker | Can modify network traffic | Inject malicious code, tamper with updates |
| Malicious Browser Extension | Can read page content, intercept inputs | Capture master password, exfiltrate decrypted data |
| Compromised Website (XSS) | Can execute scripts in origin | Access IndexedDB, capture keystrokes |
| Device Thief | Has physical access to device | Extract stored data from disk |
| Forensic Analyst | Has disk images, memory dumps | Recover deleted/plaintext data |
| Malware/Keylogger | Runs on user's device | Capture master password, screen contents |
| Compromised OS/Browser | Full system control | Bypass all protections |

### Attack Scenarios & Mitigations

#### 1. Stolen Encrypted Backup
- **Threat**: Attacker obtains backup file
- **Mitigation**: Authenticated encryption (XChaCha20-Poly1305); without master password or recovery key, data is computationally infeasible to decrypt
- **Residual Risk**: Offline password guessing if weak master password

#### 2. Unauthorized Storage Access
- **Threat**: Attacker gains access to IndexedDB storage
- **Mitigation**: All sensitive data encrypted at rest; only ciphertext stored
- **Residual Risk**: Metadata leakage (record counts, sizes, timestamps)

#### 3. Offline Password Guessing
- **Threat**: Brute-force attack on wrapped Vault Key
- **Mitigation**: Argon2id KDF with high memory/time cost; unique random salt per vault
- **Residual Risk**: Weak passwords still vulnerable; users must choose strong master passwords

#### 4. Tampering with Vault Data
- **Threat**: Attacker modifies encrypted data
- **Mitigation**: Authenticated encryption detects tampering; MAC verification before decryption
- **Residual Risk**: Denial of service (data corruption)

#### 5. Memory Extraction
- **Threat**: Cold boot attack, memory dump while vault is unlocked
- **Mitigation**: Minimize secret lifetime in memory; clear keys on lock; avoid unnecessary copies
- **Residual Risk**: Cannot guarantee memory wiping; browser/OS may have copied memory

#### 6. Keylogging
- **Threat**: Malware captures master password entry
- **Mitigation**: Out of scope for application-level defense; user education
- **Residual Risk**: High; requires endpoint security

#### 7. Malicious Browser Extensions
- **Threat**: Extension reads page DOM, intercepts inputs
- **Mitigation**: Limited; warn users about extension risks
- **Residual Risk**: High; browser extensions can often bypass web isolation

#### 8. Compromised Browser/OS
- **Threat**: Rootkit, compromised browser binary
- **Mitigation**: Out of scope; requires trusted computing base
- **Residual Risk**: Complete compromise possible

---

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    UNTRUSTED                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Network (No outbound by default)          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PARTIALLY TRUSTED                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Browser Runtime                       │  │
│  │  • May have malicious extensions                       │  │
│  │  • May leak memory to disk (swap, crash dumps)         │  │
│  │  • Subject to XSS if vulnerabilities exist             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    TRUSTED                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              AegisVault Application Code               │  │
│  │  • Audited, pinned dependencies                        │  │
│  │  • No remote code execution                            │  │
│  │  • Cryptographic operations via libsodium              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              User's Master Password                    │  │
│  │  • Never stored                                        │  │
│  │  • Only exists in user's mind                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROTECTED                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           IndexedDB (Encrypted Data at Rest)           │  │
│  │  • Ciphertext only                                     │  │
│  │  • Authenticated encryption                            │  │
│  │  • Versioned format                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Trust Assumptions

1. **Trusted**: User's device at time of use (no active malware)
2. **Trusted**: Browser implementation of Web APIs (IndexedDB, Service Workers, Crypto)
3. **Trusted**: libsodium library (audited, pinned version)
4. **Partially Trusted**: Browser runtime (extensions, potential vulnerabilities)
5. **Untrusted**: Network, any remote servers, third-party scripts

---

## Cryptographic Architecture

### Algorithm Selection

| Purpose | Algorithm | Rationale |
|---------|-----------|-----------|
| Key Derivation | Argon2id | Winner of Password Hashing Competition; resistant to GPU/ASIC attacks |
| Encryption | XChaCha20-Poly1305-IETF | Modern authenticated encryption; larger nonce reduces collision risk |
| Random Generation | libsodium randombytes | CSPRNG; never Math.random() |
| Recovery Mnemonic | BIP39 | Industry standard for mnemonic phrases |

### Key Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    KEY DERIVATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

Master Password (user-provided, never stored)
         │
         │  + Random Salt (128-bit, stored plaintext in header)
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Argon2id KDF                                    │
│  • Memory: 64 MB minimum                                     │
│  • Iterations: 3 minimum                                     │
│  • Parallelism: 4                                            │
│  • Output: 256-bit Password-Derived Key                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Password-Derived Key (wrapping key, exists only during unlock)
         │
         │  Wraps (encrypts):
         ▼
┌─────────────────────────────────────────────────────────────┐
│           Vault Encryption Key (VEK)                         │
│  • 256-bit random key                                        │
│  • Generated once at vault creation                          │
│  • Stored only in wrapped form                               │
│  • Used for all vault data encryption                        │
└─────────────────────────────────────────────────────────────┘
         │
         │  Encrypts:
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Vault Data                                      │
│  • Items (passwords, cards, identities, etc.)                │
│  • Folders and tags                                          │
│  • Attachments (via streaming encryption)                    │
│  • All authenticated with Poly1305 MAC                       │
└─────────────────────────────────────────────────────────────┘
```

### Envelope Encryption Details

**Why Envelope Encryption?**

1. **Password Change Efficiency**: Changing master password only requires re-wrapping the VEK, not re-encrypting all vault data
2. **Recovery Integration**: Recovery key can independently wrap the same VEK
3. **Key Separation**: VEK can be used for multiple purposes with domain separation

**Vault Header Structure (Plaintext)**

```json
{
  "formatVersion": 1,
  "schemaVersion": 1,
  "kdf": {
    "type": "argon2id",
    "memory": 65536,
    "iterations": 3,
    "parallelism": 4,
    "salt": "<base64-encoded-128-bit-salt>"
  },
  "wrappedVaultKey": {
    "algorithm": "XChaCha20-Poly1305",
    "nonce": "<base64-encoded-192-bit-nonce>",
    "ciphertext": "<base64-encoded-wrapped-key-with-mac>"
  },
  "recovery": {
    "enabled": false,
    "wrappedVaultKey": null
  }
}
```

**Vault Header Storage**: Stored plaintext in IndexedDB to allow KDF parameter access before unlock. Contains no user secrets—only the wrapped VEK which requires the password-derived key to unwrap.

### Nonce Management

- **Nonce Size**: 192 bits (24 bytes) for XChaCha20
- **Generation**: Random nonce per encryption operation via `randombytes_buf`
- **Never Reuse**: Each encryption uses a fresh random nonce
- **Storage**: Nonce stored alongside ciphertext (not secret)

### Salt Management

- **Salt Size**: 128 bits (16 bytes) minimum
- **Generation**: Random per vault creation
- **Purpose**: Ensures unique KDF output even if same password used
- **Storage**: Stored plaintext in vault header

---

## Storage Security

### IndexedDB Protection

| Data Type | Encryption Status | Storage Location |
|-----------|-------------------|------------------|
| Vault Header | Partially (wrapped key) | `vault-header` store |
| Vault Items | Fully encrypted | `vault-data` store |
| Attachments | Streaming encrypted | `attachments` store |
| App Settings | Plaintext (non-sensitive) | `metadata` store |

### What Is Never Stored Plaintext

- Master password (never stored at all)
- Vault Encryption Key (stored only wrapped)
- Passwords, usernames, URLs
- Item names, folder names, vault names
- Notes, tags, custom fields
- Financial data (account numbers, card details, PINs)
- Identity document data (PAN, Aadhaar, passport numbers, etc.)
- TOTP secrets, API keys, SSH keys
- Crypto wallet seeds/private keys
- Attachment contents

### Acceptable Plaintext in Storage

- Record IDs (UUIDs for reference)
- Timestamps (created, modified, accessed)
- Record type identifiers (e.g., "login", "card", "identity")
- Encrypted blob sizes (for progress indication)
- Format/schema version numbers
- KDF parameters (required for unlock)
- Wrapped keys (ciphertext only)

---

## Memory Security

### Secret Lifetime Minimization

1. **Master Password**: Cleared immediately after KDF derivation
2. **Password-Derived Key**: Exists only during unlock; cleared after VEK unwrapped
3. **Vault Encryption Key**: Held in memory only while vault is unlocked; cleared on lock
4. **Decrypted Data**: Exists only while accessed; not cached unnecessarily

### Memory Limitations (Browser Environment)

**Cannot Guarantee:**

- Memory zeroing (JavaScript has no secure memory wipe)
- Prevention of swap/pagefile writes
- Prevention of crash dump creation
- Protection from browser memory inspection
- Garbage collection timing

**Mitigations:**

- Use `Uint8Array` for sensitive data (can be zeroed manually)
- Avoid string concatenation for secrets (strings are immutable in JS)
- Clear arrays with zeros when done
- Lock vault after timeout to minimize exposure window
- Warn users about memory limitations in documentation

---

## Backup Security

### Export Format

```
┌─────────────────────────────────────────────────────────────┐
│                  ENCRYPTED BACKUP FILE                       │
├─────────────────────────────────────────────────────────────┤
│  Header (plaintext):                                         │
│    • Magic bytes ("AEGISVAULT")                              │
│    • Format version                                          │
│    • Schema version                                          │
│    • KDF parameters                                          │
│    • Salt                                                    │
├─────────────────────────────────────────────────────────────┤
│  Wrapped Vault Key (encrypted):                              │
│    • Nonce                                                   │
│    • Ciphertext (VEK wrapped with password-derived key)      │
│    • MAC                                                     │
├─────────────────────────────────────────────────────────────┤
│  Encrypted Vault Data:                                       │
│    • Nonce                                                   │
│    • Ciphertext (all vault data)                             │
│    • MAC                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Backup Properties

- **Authenticated Encryption**: Tampering detected via Poly1305 MAC
- **Versioned**: Format and schema versions enable migration
- **Self-Contained**: Includes all information needed for import
- **Not Checksum-Based**: Security relies on authenticated encryption, not simple hashes

---

## Recovery System Security

### BIP39 Implementation

- **Word Count**: 24 words (provides 256 bits of entropy)
- **Word List**: Standard BIP39 English wordlist (2048 words)
- **Checksum**: BIP39 includes built-in checksum validation
- **Independent**: Recovery key is separate from master password

### Recovery Flow

1. Generate cryptographically secure 256-bit entropy
2. Convert to 24-word BIP39 mnemonic
3. Derive recovery key from mnemonic (PBKDF2 or similar per BIP39)
4. Use recovery key to wrap Vault Encryption Key
5. Store wrapped VEK in vault header
6. User stores mnemonic externally (paper, metal, etc.)

### Recovery Setup Requirements

- Display mnemonic clearly (one-time opportunity)
- Require user confirmation
- Test with 3 randomly selected words
- Warn about permanent loss if both password and mnemonic lost
- Never log, transmit, or store mnemonic plaintext

### Periodic Verification

- Remind user to verify recovery phrase accessibility
- Default reminder interval: ~6 months
- Allow user to configure interval
- Provide secure verification workflow

---

## Password Generator Security

### Requirements

- **Source**: libsodium `randombytes_uniform()` only
- **Never**: `Math.random()`, `Date.now()`, or predictable sources
- **Length Range**: 12-128 characters (128 maximum)
- **Character Sets**: Configurable (lowercase, uppercase, numbers, symbols)
- **Passphrases**: Configurable word count, separator, optional capitalization/numbers/symbols
- **PINs**: Secure random numeric generation

### Implementation Notes

- Ensure uniform distribution across character set
- Avoid modulo bias (use `randombytes_uniform`)
- Validate minimum entropy requirements
- Provide strength indicator based on length and character set

---

## PWA Update Security

### Update Strategy

1. **Offline First**: App works fully offline after installation
2. **Cached Assets**: All code cached via Service Worker
3. **No Remote Code**: No runtime fetching of external scripts
4. **Controlled Updates**: User notified of available updates; chooses when to apply
5. **Migration Safety**: Vault format migrations tested before committing
6. **Rollback Capability**: Maintain previous version until migration confirmed

### Service Worker Security

- Cache all application assets locally
- No network requests for core functionality
- Update check is optional and user-initiated (or background with explicit permission)
- Verify update integrity before applying

---

## Security Limitations (Documented)

### What AegisVault Cannot Protect Against

1. **Malware/Keyloggers**: If device is compromised, master password can be captured
2. **Malicious Browser Extensions**: Extensions may have access to page content
3. **Compromised Browser**: Modified browser can bypass all protections
4. **Compromised OS**: Rootkits, kernel-level malware defeat application security
5. **Physical Access with Memory Analysis**: Cold boot attacks may recover keys from RAM
6. **Screen Capture**: Malware capturing screenshots can see decrypted data
7. **Social Engineering**: Users can be tricked into revealing passwords
8. **Weak Master Password**: Strong cryptography cannot compensate for weak passwords

### Browser Environment Limitations

- No secure enclave access in browser context
- Cannot prevent swap/pagefile writes
- Cannot guarantee memory zeroing
- Subject to Spectre/Meltdown-style attacks
- Dependent on browser's security implementation

### Documentation Requirement

All limitations must be clearly documented in user-facing materials. Never claim the application is "unbreakable" or provides perfect security.

---

## Compliance & Standards

### Followed Specifications

- **BIP39**: Bitcoin Improvement Proposal 39 for mnemonic phrases
- **libsodium API**: As documented at libsodium.org
- **Web Crypto API**: W3C specification where applicable
- **OWASP ASVS**: Application Security Verification Standard guidelines

### Not Claiming

- FIPS certification (not pursued)
- SOC 2 compliance (no cloud service)
- GDPR compliance statements (local-only storage)
- Medical/financial regulatory compliance (tool, not service)

---

## Security Incident Response (Future)

When the project reaches public release:

1. **Vulnerability Reporting**: Establish secure reporting channel
2. **Disclosure Policy**: Coordinated disclosure process
3. **Patch Process**: Rapid patching for critical vulnerabilities
4. **User Notification**: Mechanism to notify users of security updates

---

*Last Updated: Phase 0 - Initial Security Model*
