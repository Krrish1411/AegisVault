# AegisVault — Project Constitution

## 1. Mission

AegisVault is a privacy-first, local-first, offline-first personal password manager and encrypted personal-data vault.

It begins as a browser PWA and must be architected so the same domain/application logic can later run in desktop and mobile shells.

## 2. Non-negotiable product properties

- No account required.
- No backend.
- No cloud sync in the default product.
- No telemetry, analytics, advertising, crash reporting, or tracking.
- No network request required to unlock or use an existing vault.
- No runtime CDN dependencies, remote fonts, remote CSS, or remote third-party scripts.
- Persistent storage contains encrypted vault content, not plaintext secrets.
- Security claims must be precise; never say “unbreakable”, “impossible to hack”, or equivalent.

## 3. Security constitution

Never invent cryptography. Never implement homemade encryption. Use established, reviewed primitives through mature libraries.

Target architecture:

Master Password
  -> Argon2id KDF
  -> Password-Derived Key
  -> unwrap Vault Encryption Key
  -> XChaCha20-Poly1305 authenticated encryption
  -> encrypted vault payload

The Vault Encryption Key is random 256-bit material and is not directly derived from the master password.

Use key separation/domain separation for unrelated purposes. Use unique salts and unique nonces. Generate secrets with a cryptographically secure RNG only.

Master password and recovery phrase are never persisted in plaintext.

## 4. Source-of-truth hierarchy

When implementation choices conflict, use this order:

1. Security invariants in `SECURITY.md`.
2. Data/format contracts in `DATA_MODEL.md`.
3. Architecture boundaries in `ARCHITECTURE.md`.
4. Product behavior in this file.
5. UI guidance in `UI_UX.md`.
6. Individual phase prompt.

A phase prompt may add detail but may not weaken an earlier invariant.

## 5. Stack decision

### Web/PWA

- React 19.x
- TypeScript (strict)
- Vite
- Tailwind CSS
- shadcn/ui as a component foundation, heavily customized to AegisVault’s design language
- React Router
- Zod for runtime validation of untrusted/imported data
- Zustand only for ephemeral UI/session state; never as a persistence layer
- Dexie over IndexedDB as the storage adapter implementation, isolated behind repository interfaces
- libsodium / libsodium.js bindings for cryptographic primitives
- Vitest for unit/integration tests
- Testing Library for component tests
- Playwright for end-to-end browser tests
- Workbox or an equivalent carefully reviewed service-worker approach for offline asset caching

### Future shells

- Tauri 2 for desktop
- Capacitor or native integrations for mobile
- OS Keychain / Android Keystore / platform secure storage where available
- Native biometric APIs; no custom biometric cryptography

## 6. Dependency policy

Dependencies must earn their place.

Before adding a package, document:

- why the package is needed
- whether a platform/browser API can replace it
- security impact
- bundle impact
- maintenance health
- license compatibility

Never add a dependency only to save a few lines of code in a security-sensitive area.

## 7. UI philosophy

The visual target is “quiet luxury for security software”: minimal, premium, modern, polished, tactile, calm, and trustworthy.

The interface must work for both non-technical and technical users without creating two products.

Simple Mode:
- plain language
- guided flows
- minimal decisions
- strong defaults
- reassuring explanations

Advanced Mode:
- the same security core
- more diagnostics
- more organization
- more technical detail
- more explicit configuration

Never expose advanced terminology in Simple Mode unless the user opens an explanation.

## 8. Build philosophy for AI coding agents

The AI must work phase-by-phase. It must not jump ahead because a later feature looks easy.

Before starting a phase:
- read `PROJECT.md`
- read `PROGRESS.md`
- read the phase prompt
- inspect the current repository tree
- inspect tests and existing contracts
- identify unfinished or ambiguous work

During a phase:
- build incrementally
- run tests after each security-sensitive change
- avoid speculative abstractions
- preserve existing working behavior

After a phase:
- run the phase verification checklist
- update `PROGRESS.md`
- record changed files
- record tests run and their result
- record known limitations/risks
- record any decisions that affect future phases
- stop at the phase boundary

## 9. Definition of done for every phase

A phase is complete only when:

- required functionality exists
- automated tests exist for the important paths
- security-sensitive behavior has negative/failure tests
- no known plaintext persistence regression exists
- no new network dependency was introduced accidentally
- TypeScript build passes
- lint/type checks pass
- test suite for affected areas passes
- documentation/progress is updated
- the next phase has a clean starting point

## 10. Repository contract

The expected code organization is documented in `ARCHITECTURE.md`.

The AI may improve the structure when justified, but it must keep the architectural boundaries intact:

UI -> Application Services -> Domain/Security -> Ports/Repositories -> Storage/Platform

Crypto must never leak upward into arbitrary UI code, and UI code must never talk directly to IndexedDB/native storage.
