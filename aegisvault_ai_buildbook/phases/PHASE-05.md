# Phase 05 — Organization, Search & Password History

## Objective

Scale the vault from a few records to a personal information system.

## Tasks

1. Folders.
2. Nested folders.
3. Multiple vaults.
4. Tags.
5. Favorites.
6. Archive.
7. Sorting/filtering.
8. Search while unlocked.
9. In-memory search index only.
10. Encrypted password history.
11. Restore previous password.
12. Delete history.

## Important

Do not create a permanent plaintext search index.

## UI

Navigation must remain simple in Simple Mode even if the underlying organization is powerful.

Advanced Mode can expose vault and folder managers.

## Tests

- nested folder moves
- search across supported fields
- lock destroys search index
- history is encrypted at rest
- vault switching does not leak data between sessions

## Progress

Update `PROGRESS.md` before completion.
