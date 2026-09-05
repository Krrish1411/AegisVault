# Phase 04 — Security Center & Local Password Health

## Objective

Turn the product’s security model into a useful local experience.

## Tasks

1. Security Center dashboard.
2. Local weak-password detection.
3. Reused/duplicate detection.
4. Old password detection.
5. Common-password detection using a local dataset where practical.
6. Predictability heuristics.
7. Backup status.
8. Recovery status.
9. Auto-lock status.
10. Last scan date.
11. App version and vault format version.
12. Advanced crypto configuration summary.

## Constraints

All analysis happens locally.

Never upload passwords as part of this phase.

## UX

Prioritize actionability over an arbitrary score.

Each finding should have an obvious “what should I do next?” action.

## Tests

Create deterministic fixtures for weak, reused, old, common and healthy secrets.

Verify that the analysis never leaves the device.

## Progress

Update `PROGRESS.md` before completion.
