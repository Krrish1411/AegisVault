# Phase 00 — Foundation, Architecture & Design System

## Objective

Create a clean, testable project foundation before implementing vault behavior.

## Read first

`PROJECT.md`, `PROGRESS.md`, `ARCHITECTURE.md`, `SECURITY.md`, `UI_UX.md`, `DEVELOPMENT_RULES.md`.

## Tasks

1. Scaffold React 19 + TypeScript + Vite.
2. Configure strict TypeScript.
3. Add Tailwind CSS and create semantic design tokens.
4. Add shadcn/ui primitives only where useful; customize them to AegisVault.
5. Set up routing.
6. Set up Vitest, Testing Library, Playwright.
7. Add linting/formatting.
8. Create the architectural directory structure.
9. Create crypto/storage/platform/application interfaces but no fake crypto implementation.
10. Add an app shell with light/dark theme support.
11. Implement Welcome, placeholder Unlock, placeholder Dashboard, Settings shell, and Lock state navigation as visual foundations only.
12. Build core UI primitives: Button, Input, SecretInput, Card, StatusIndicator, ListRow, Dialog/Sheet, EmptyState, Toast.
13. Set up a typed error strategy.
14. Add security-conscious logging policy: no secret logging.
15. Add basic network guard/test hooks so accidental calls are discoverable.

## UI acceptance

The app must already feel premium and coherent.

Required:
- consistent spacing
- responsive shell
- strong empty states
- polished buttons/forms
- keyboard focus
- light/dark theme
- no external runtime fonts

## Security acceptance

No vault secrets are implemented yet. That is intentional.

Do not create dummy plaintext “vault data” and persist it as a fake security implementation.

## Stop condition

Do not begin real cryptography or vault persistence in this phase.

## Progress requirement

Before declaring complete, update `PROGRESS.md` with files changed, commands run, screenshots/visual checks performed if available, and any architectural decisions.
