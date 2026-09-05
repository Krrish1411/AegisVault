# Phase 10 — Migration, Crypto Upgrade Path & PWA Hardening

## Objective

Make the vault durable over years rather than only one release.

## Tasks

1. Explicit format versioning.
2. Explicit crypto-profile versioning.
3. Migration registry.
4. Migration preflight validation.
5. Atomic migration commit.
6. Rollback/preservation of old vault.
7. KDF parameter upgrade support.
8. Crypto-profile upgrade support.
9. Key-wrap upgrade support.
10. PWA offline asset strategy.
11. Controlled update UX.
12. No runtime remote code.
13. Verify that an existing vault unlocks without network access.

## Update UX

When a new app version is available, show it as an explicit user-controlled update.

Never silently replace a sensitive application with an unknown remote update.

## Tests

- every migration path
- simulated migration failure
- old vault preservation
- unsupported future format
- offline unlock after app update
- service-worker update behavior

## Progress

Update `PROGRESS.md` before completion.
