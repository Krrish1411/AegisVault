# Phase 01 — Vault Core & Simple Mode Login Vault

## Objective

Implement the first real secure vault: create, unlock, lock, add/edit/delete login items.

## Mandatory reading

Read all project docs plus `PROGRESS.md` before coding.

## Tasks

1. Integrate the approved libsodium-backed crypto provider.
2. Verify actual library APIs; do not guess.
3. Initialize sodium correctly.
4. Implement secure random 256-bit Vault Key generation.
5. Implement Argon2id-based password-derived key with explicit salt/parameters.
6. Implement Vault Key wrapping.
7. Implement XChaCha20-Poly1305 IETF encryption/decryption.
8. Define the v1 encrypted vault container.
9. Implement authenticated serialization/validation.
10. Implement IndexedDB persistence behind `VaultRepository`.
11. Implement create vault flow.
12. Implement unlock flow.
13. Implement lock flow.
14. Implement login item create/read/update/delete.
15. Ensure metadata such as title, folder names and URLs are kept inside encrypted payload unless explicitly needed for unlock metadata.
16. Implement encrypted audit events for basic mutations if included in the phase scope.

## UI

Simple Mode screens:
- Create Vault
- Unlock
- Dashboard
- Password list
- Password detail
- Add/Edit Password
- Lock

Sensitive fields are hidden by default.

## Required tests

- create vault
- unlock with correct password
- wrong password fails
- tampered ciphertext fails
- lock clears session state
- CRUD round trip
- reload browser -> encrypted vault remains
- inspect IndexedDB -> no plaintext test secrets

## Critical rule

Do not derive the Vault Key directly from the master password.

## Stop condition

Do not add recovery, generator, folders, or advanced item types yet.

## Progress requirement

Update `PROGRESS.md` before completion.
