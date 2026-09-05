# AegisVault — Agent Session Checklist

## START

- [ ] Read PROJECT.md
- [ ] Read PROGRESS.md
- [ ] Read ARCHITECTURE.md
- [ ] Read SECURITY.md
- [ ] Read current phase prompt
- [ ] Inspect repository/tree
- [ ] Confirm current phase from PROGRESS.md
- [ ] Do not implement later-phase features

## BEFORE SECURITY-SENSITIVE CODE

- [ ] Verify installed library API/documentation
- [ ] Define/confirm input/output contract
- [ ] Define failure behavior
- [ ] Add negative tests
- [ ] Confirm no plaintext persistence path

## BEFORE PHASE COMPLETE

- [ ] Unit tests pass
- [ ] Integration tests pass where relevant
- [ ] E2E tests pass where relevant
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] Offline/network behavior checked where relevant
- [ ] Persistent storage checked for plaintext where relevant
- [ ] PROGRESS.md updated
- [ ] Next phase recommendation recorded

## NEVER

- [ ] No Math.random for secrets
- [ ] No homemade crypto
- [ ] No secret logging
- [ ] No secrets in URLs
- [ ] No runtime CDN code
- [ ] No silent destructive migration
- [ ] No “unbreakable” claims
