# AegisVault — Security Architecture & Threat Model

## 1. Security posture

AegisVault is designed to make offline compromise substantially harder, not to promise absolute security.

Primary goal: protect the vault when encrypted storage is copied or inspected and the attacker does not have the unlocked session/master password.

## 2. Threats the architecture addresses

Designed to resist or limit:
- stolen encrypted vault/backup files
- unauthorized IndexedDB inspection
- offline password guessing
- tampered encrypted exports
- storage-provider access to ciphertext
- accidental sensitive metadata exposure within the persistent vault

## 3. Explicit limitations

The application cannot fully protect against:
- malware
- malicious browser extensions
- compromised OS
- compromised browser
- keyloggers
- observation of the master password
- an attacker using an already-unlocked device
- unknown vulnerabilities
- malicious/compromised application updates

## 4. Key hierarchy

```text
Master Password
     │
     ▼
 Argon2id
     │
     ▼
Password-Derived Key
     │
     ▼
Wrap / Unwrap Vault Encryption Key
     │
     ▼
Random 256-bit Vault Key
     │
     ├── domain-separated subkeys where required
     │
     ▼
XChaCha20-Poly1305
     │
     ▼
Encrypted vault payload
```

Recovery uses an independent derivation/wrapping path. Future sharing must use independent user/device key material and must never require a master-password share.

## 5. KDF rules

Use Argon2id through the selected mature crypto library API.

Parameters must be:
- salted with unique random salt
- explicit and stored as vault unlock metadata
- benchmarked for the actual browser/device
- configurable enough to upgrade later

The AI must not invent “recommended” parameters from memory. During implementation, it must verify the actual library API and document the benchmark method/results. Do not blindly select an extreme fixed value that makes normal browser/mobile use unusable.

## 6. AEAD rules

Use XChaCha20-Poly1305 IETF through the approved crypto library.

Authenticated encryption must cover ciphertext integrity and any authenticated associated data required by the format.

Never reuse a nonce for the same key under the chosen protocol. Random nonces are acceptable for XChaCha20-Poly1305 when generated from a cryptographically secure RNG, but the protocol must still make nonce handling explicit.

## 7. Randomness

Allowed security-sensitive sources:
- libsodium RNG
- browser Web Crypto `crypto.getRandomValues()` where explicitly appropriate
- secure OS/native RNG through platform adapters

Forbidden:
- `Math.random()`
- timestamps as entropy
- UUIDs as secret material without a documented secure construction
- user-visible strings as entropy

## 8. Persistent plaintext prohibition

Never persist plaintext:
- passwords
- usernames
- URLs
- notes
- bank information
- card details
- identity data
- document contents
- TOTP secrets
- seed phrases/private keys
- master password
- recovery phrase

No persistent plaintext index.

## 9. Logs

Security-sensitive values must never appear in:
- console logs
- error telemetry
- URL parameters/fragments
- analytics
- crash reports
- clipboard diagnostics
- test output

For debugging, log only structural events and non-sensitive identifiers where justified.

## 10. Lock behavior

On lock:
- destroy decrypted application state
- clear sensitive temporary state
- release key material as far as practical
- clear application-created clipboard content where supported
- stop workers that hold sensitive context where feasible

Do not claim that JavaScript memory can be perfectly wiped.

## 11. Recovery

Recovery phrase generation/encoding must use a standards-compliant BIP39 implementation or another explicitly reviewed implementation; do not create a custom word-list scheme.

The recovery secret is independent from the master password and wraps the Vault Key through a separate purpose.

The actual phrase is shown only during controlled recovery flows and is never persisted as plaintext.

## 12. Import validation

Imported data is untrusted.

Validate:
- format version
- crypto profile
- all lengths/encodings
- enum values
- required fields
- attachment limits
- structural invariants

Reject unknown future versions safely. Never guess how to decode an unsupported vault.

## 13. Migration safety

Never overwrite the only known-valid vault before successful migration.

Safe migration pattern:

```text
old valid vault
     │
     ├── backup/preserve
     ▼
read + authenticate + decrypt
     ▼
validate old format
     ▼
construct new representation
     ▼
encrypt new representation
     ▼
validate new container
     ▼
atomic commit
     ▼
mark migration complete
```

If any step fails, the old vault remains recoverable.

## 14. Web security

Use:
- HTTPS in deployment
- strict CSP
- frame restrictions
- secure referrer policy
- MIME sniffing protection
- appropriate Permissions Policy

Avoid all runtime remote code.

The app should not have a reason to contact third-party services in its default mode.

## 15. Optional online breach check

Off by default.

Explicit user consent.

Never transmit plaintext passwords or full password hashes.

Use a privacy-preserving protocol such as k-anonymity where appropriate, and disclose the exact data sent before the request occurs.

## 16. Security acceptance tests

Required tests include:
- wrong password fails
- tampered ciphertext fails
- wrong recovery phrase fails
- corrupted backup is rejected
- generated secrets use secure RNG path
- nonce handling is tested
- decrypted data disappears from application state on lock
- no plaintext secret appears in IndexedDB/localStorage
- no secret is inserted into URL
- no unexpected network request is made in offline/default mode
- migration failure preserves original vault
- unsupported format fails closed
