# AegisVault — Testing & Verification Strategy

## 1. Test pyramid

### Unit

Fast tests for:
- domain validation
- password policy
- item schemas
- serialization
- crypto wrapper contracts
- key separation/context handling
- password generator
- passphrase generator
- TOTP calculation
- migration transforms

### Integration

Test boundaries:
- crypto + vault container
- application services + repositories
- repository + IndexedDB adapter
- import/export
- attachment encryption/storage

### E2E

Playwright scenarios:
- create vault
- lock/unlock
- add/edit/delete login
- copy/reveal secret
- auto-lock
- recovery setup
- recovery verification
- recovery unlock
- backup creation/restore
- offline reload
- PWA update experience
- document import/export

## 2. Security test requirements

For each cryptographic operation test both success and failure.

Required negative cases:
- wrong master password
- wrong recovery phrase
- changed ciphertext
- changed authenticated metadata
- malformed container
- wrong version
- wrong nonce length
- wrong key length
- truncated attachment
- corrupted backup

## 3. Persistence inspection tests

After creating realistic data, inspect IndexedDB and localStorage and assert that plaintext examples are absent.

Test for:
- password values
- usernames where applicable
- URLs
- notes
- bank account numbers
- card numbers
- seed phrases
- recovery phrase

The point is not merely “the UI works”; the persistence boundary must be verified.

## 4. Network tests

Default application paths should operate with the network disabled.

Automated tests must detect accidental network requests during:
- first vault creation after assets are present
- unlock
- add/edit/delete
- search
- backup
- security scan

The optional breach check is a separate, explicit path and must be tested independently.

## 5. Generator tests

Verify:
- requested length range
- 128-character maximum
- character policy
- minimum counts
- ambiguous-character policy
- passphrase word counts
- PIN length/constraints
- no insecure RNG fallback

Avoid claiming statistical randomness guarantees from superficial snapshot tests. Test that the secure RNG API is actually invoked.

## 6. Migration tests

For every migration:
- valid old vault -> valid new vault
- invalid old vault -> safe failure
- simulated mid-migration failure -> old vault still openable
- unsupported newer version -> explicit rejection
- repeated migration is idempotent where intended

## 7. Accessibility tests

At minimum:
- keyboard-only completion of core flows
- focus order
- labels for sensitive controls
- dialog focus management
- reduced-motion behavior

## 8. Performance checks

Measure:
- cold start
- unlock duration
- large vault unlock
- security scan on realistic data
- large attachment import
- search latency after unlock

Argon2id parameter selection must be evidence-based from local benchmarks, not copied blindly from a blog post.

## 9. Release gate

Do not ship when:
- TypeScript fails
- lint fails on security-critical code
- required tests fail
- secrets appear in persistent storage
- unexpected runtime network requests exist
- unsupported vault formats are silently accepted
- migration can destroy the previous valid vault
