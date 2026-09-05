# Phase 11 — Desktop & Mobile Readiness

## Objective

Move from PWA architecture to native shells without rewriting the core security/application model.

## Desktop

Prepare Tauri 2 integration:
- native secure storage
- OS credential/keychain integration
- native file access
- native clipboard behavior
- native lifecycle handling
- native biometric APIs where available

## Mobile

Prepare Capacitor/native integration or a more appropriate native shell based on the project’s actual requirements.

Integrate:
- iOS Keychain
- Android Keystore
- app background/foreground handling
- biometrics
- native secure file access

## Rules

Business/domain logic remains platform-agnostic.

Native layers provide adapters through the same ports defined in `ARCHITECTURE.md`.

Do not create a second cryptographic architecture for native builds unless a documented security review requires it.

## Tests

Add platform-specific integration tests for secure storage and lifecycle behavior.

Verify that desktop/mobile builds do not regress the web threat model.

## Progress

Update `PROGRESS.md` before completion.
