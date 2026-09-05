# Phase 07 — Documents, Attachments & Secure Notes

## Objective

Create the encrypted personal document vault.

## Tasks

1. Secure Notes.
2. PDF/JPG/PNG/WEBP/TXT support where browser capabilities permit.
3. Attachment metadata encrypted.
4. Authenticated encryption for file content.
5. Streaming authenticated encryption for large files where appropriate.
6. 50 MB initial single-file limit.
7. 500 MB recommended vault target.
8. Storage quota detection/warnings.
9. Large-import confirmation.
10. Attachment add/view/download/delete.
11. Secure-note checklists/tags/important flag.

## UI

Documents should feel like a private drawer/library, not a generic file manager.

Preview when safe and practical; otherwise use clear file cards and secure download/open actions.

## Tests

- attachment round trip
- corrupted attachment rejection
- size limits
- quota errors
- metadata is encrypted
- lock destroys access to decrypted attachment state

## Progress

Update `PROGRESS.md` before completion.
