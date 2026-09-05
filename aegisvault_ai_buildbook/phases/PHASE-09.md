# Phase 09 — Family Sharing, Emergency Kit & Optional Online Check

## Objective

Add controlled sharing without cloud sync becoming mandatory.

## Tasks

1. Encrypted full-vault export for manual sharing.
2. Encrypted folder export.
3. Selected-item export.
4. Encrypted family import.
5. Roles: owner/admin/member/view_only/restricted.
6. Emergency Kit with user-selected information only.
7. Printable instructions.
8. Optional breach check, off by default.
9. Explicit internet consent UI.
10. Privacy-preserving protocol where appropriate.
11. Research/guardrails for optional duress vault; do not imply forensic plausible deniability.

## Critical constraint

Never require sharing the master password.

Future multi-device sharing must use independent public-key/device identity material.

## Tests

- role-based export/import behavior
- no plaintext secrets in exported package
- breach feature is impossible to trigger accidentally from offline flows
- privacy explanation is shown before network access

## Progress

Update `PROGRESS.md` before completion.
