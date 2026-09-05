# Phase 03 — Recovery & Encrypted Import/Export

## Objective

Add independent recovery and safe encrypted file portability.

## Tasks

1. Generate recovery secret using a standards-compliant BIP39 implementation.
2. Implement independent recovery key derivation/wrapping path.
3. Show recovery phrase once during setup.
4. Require confirmation using 3 randomly selected words.
5. Never store the phrase plaintext.
6. Implement recovery verification and verification date.
7. Implement recovery unlock.
8. Implement change master password by re-wrapping Vault Key.
9. Implement encrypted full-vault export.
10. Implement encrypted import.
11. Validate all imported data.
12. Reject unsupported versions.
13. Preserve active vault until imported data is fully validated.

## UI

Recovery should be calm, focused, and explicit about permanent loss risk.

Export/Import should explain what is encrypted and whether the file can be used without the master password.

## Tests

- wrong recovery phrase
- valid recovery unlock
- recovery phrase not in storage
- master password change preserves data
- export/import round trip
- tampered export rejected
- malformed export rejected
- newer unsupported export rejected

## Progress

Update `PROGRESS.md` before completion.
