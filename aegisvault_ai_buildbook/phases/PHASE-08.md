# Phase 08 — TOTP, Crypto Wallets & Recovery Materials

## Objective

Add specialized high-sensitivity secret types.

## Tasks

1. TOTP storage and local code generation.
2. Countdown UI.
3. Copy current TOTP.
4. BIP39 wallet seed handling.
5. Checksum validation.
6. Support 12/15/18/21/24-word seed lengths.
7. Optional wallet passphrase support.
8. Private key record support.
9. Printable recovery materials.
10. Emergency instructions UX foundation.

## Constraints

TOTP secrets, wallet seeds and private keys never leave the vault.

Never confuse a product recovery phrase with a cryptocurrency seed phrase in data models or UI copy.

## Tests

Use known deterministic BIP39/TOTP fixtures.

Verify secret masking and encrypted persistence.

## Progress

Update `PROGRESS.md` before completion.
