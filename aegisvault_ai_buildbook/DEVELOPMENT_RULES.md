# AegisVault — AI Development Rules

## Rule 1 — Read before coding

At the beginning of every session:

1. Read `PROJECT.md`.
2. Read `PROGRESS.md`.
3. Read the current phase prompt.
4. Inspect the current repository state.
5. Identify what is already implemented vs planned.

## Rule 2 — Never fabricate APIs

For security libraries, inspect the actual installed version/documentation/source typings before using an API.

Do not guess function names, parameters, constants, algorithms, or browser support.

## Rule 3 — No silent architecture changes

If a change affects:
- vault format
- crypto profile
- key hierarchy
- persistence schema
- security boundaries
- import/export format
- platform abstraction

record a decision in `PROGRESS.md` before treating the change as settled.

## Rule 4 — No feature creep

Only implement the features assigned to the current phase unless a prerequisite is necessary to make the phase work.

## Rule 5 — No security theater

Do not add fake “military-grade”, “unhackable”, fake entropy meters, fake encryption animations, or meaningless security scores.

## Rule 6 — Fail closed

Authentication, decryption, import, migration, and format parsing failures must result in safe failure.

## Rule 7 — Minimize secret lifetime

Keep sensitive data in memory only as long as required. Avoid duplicated copies in component state, logs, errors, URLs, clipboard, or global stores.

## Rule 8 — UI follows security

A prettier interaction must never weaken a security invariant.

## Rule 9 — Test before marking complete

A feature is not complete because the happy path works.

Required pattern:
- happy path
- invalid input
- corruption/tampering where relevant
- persistence inspection where relevant
- offline behavior where relevant

## Rule 10 — Keep progress durable

Every phase prompt ends with the same obligation:

> Before declaring the phase complete, update `PROGRESS.md` with status, files changed, tests run, security notes, unresolved issues, and the exact next recommended phase.

## Rule 11 — Preserve working vaults

Never perform destructive migrations or format rewrites without rollback/preservation.

## Rule 12 — Keep Simple and Advanced modes unified

They are presentation modes, not separate security models.
