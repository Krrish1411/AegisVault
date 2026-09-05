# AegisVault — Phase Map

The detailed prompts live in `phases/PHASE-00.md` through `phases/PHASE-11.md`.

| Phase | Deliverable |
|---|---|
| 0 | Toolchain, architecture skeleton, design system foundation, contracts, testing harness |
| 1 | Simple Mode vault creation/unlock + encrypted password CRUD |
| 2 | Generator, clipboard, auto-lock, sensitive-field UX |
| 3 | Recovery setup/verification/recovery unlock + encrypted import/export |
| 4 | Security Center + local password health |
| 5 | Folders, vaults, tags, favorites, search, password history |
| 6 | Banking, cards, identity and government-ID records |
| 7 | Documents, encrypted attachments, secure notes |
| 8 | TOTP, crypto wallets, BIP39 handling, printable recovery materials |
| 9 | Manual encrypted sharing, emergency kit, optional online breach check, duress research/guardrails |
| 10 | Format migrations, crypto-upgrade framework, PWA update hardening |
| 11 | Tauri desktop/mobile architecture and secure native adapters |

## Global phase workflow

```text
Read project + progress
        ↓
Inspect repository
        ↓
Plan only current phase
        ↓
Implement smallest coherent slice
        ↓
Run tests/typecheck/lint/build
        ↓
Security inspection
        ↓
Update PROGRESS.md
        ↓
Stop at phase boundary
```
