# Phase 02 — Secret Generation & Session Safety

## Objective

Make everyday secret creation and handling safer and more polished.

## Tasks

1. Secure password generator.
2. Secure passphrase generator.
3. PIN generator.
4. 12–128 length support; default 20.
5. Secure RNG only.
6. Character-set controls.
7. Ambiguous/similar character exclusions.
8. Minimum character counts.
9. Clipboard copy with default 20-second clear where browser support permits.
10. Configurable 10/20/30/60 second clipboard behavior.
11. Auto-lock: 1/5/10/15/30/Never; default 5 minutes.
12. Lock on inactivity and appropriate visibility/background changes.
13. Sensitive field reveal interactions.
14. Password history foundation if needed by the UX.

## UI standard

Generator should be a first-class premium utility with a large generated-value preview and simple controls.

Do not build a giant settings form as the default view.

## Tests

Verify generator constraints and secure RNG path.
Verify clipboard timeout behavior.
Verify auto-lock.
Verify lock destroys decrypted session projections.

## Progress

Update `PROGRESS.md` before completion.
