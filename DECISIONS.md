# AegisVault - Decision Log

This document records important technical and security decisions made during AegisVault development, including the rationale and any alternatives considered.

---

## Phase 0 Decisions

### DEC-001: Web-First Development Strategy

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

Develop the browser PWA (Head 1) completely before adapting to desktop (Tauri 2) or mobile (Capacitor/native).

#### Rationale

1. **Single Platform Focus**: Browser development has unique constraints (IndexedDB, Service Workers, memory limitations) that require dedicated attention
2. **Security Audit Simplicity**: Auditing one platform thoroughly is better than spreading effort across three
3. **Code Reusability**: Well-architected web code can be wrapped for desktop/mobile with minimal changes
4. **Faster Iteration**: Browser development cycle is faster than native platform builds
5. **Clear Migration Path**: Desktop/mobile adaptations are primarily storage and authentication layer changes

#### Alternatives Considered

- **Parallel Development**: Build all platforms simultaneously
  - *Rejected*: Spreads security review too thin; increases bug surface area
- **Desktop First**: Start with Tauri for better crypto access
  - *Rejected*: Browser PWA reaches more users initially; Tauri adaptation is straightforward once web version is stable

#### Consequences

- Mobile/desktop users must wait for Head 1 completion
- Some native features (biometric auth, secure enclave) unavailable in browser version
- Requires discipline to avoid platform-specific optimizations that complicate later migration

---

### DEC-002: libsodium for Cryptography

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Critical  

#### Decision

Use libsodium (via JavaScript bindings) as the sole cryptographic library for all cryptographic operations.

#### Rationale

1. **Audited Library**: libsodium is widely audited and used in production systems
2. **Modern Algorithms**: Provides XChaCha20-Poly1305, Argon2id, and secure random generation
3. **Safe API**: Designed to prevent misuse (no algorithm selection confusion, safe defaults)
4. **Cross-Platform**: Available in browser (libsodium-wrappers), Tauri (Rust bindings), and mobile
5. **No Custom Crypto**: Eliminates temptation to invent custom cryptographic solutions

#### Alternatives Considered

- **Web Crypto API**: Native browser cryptography
  - *Rejected*: Does not support Argon2id; XChaCha20 support inconsistent; API is verbose and error-prone
- **TweetNaCl.js**: Lightweight alternative
  - *Rejected*: xsalsa20 instead of XChaCha20; Argon2id not included; less actively maintained
- **Multiple Libraries**: Use different libraries for different purposes
  - *Rejected*: Increases dependency surface; complicates auditing

#### Consequences

- Dependency on external library (must pin version, monitor for vulnerabilities)
- libsodium-wrappers adds ~600KB to bundle (acceptable for security benefit)
- Must ensure consistent library usage across future platform adaptations

---

### DEC-003: Envelope Encryption Architecture

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Critical  

#### Decision

Implement envelope encryption: Master Password → Argon2id → Password-Derived Key → wraps Vault Encryption Key → encrypts vault data.

#### Rationale

1. **Password Change Efficiency**: Changing master password only requires re-wrapping VEK, not re-encrypting all data
2. **Recovery Integration**: Recovery mnemonic can independently wrap the same VEK
3. **Key Separation**: VEK can be derived into subkeys for different purposes (data, attachments, HMAC)
4. **Performance**: KDF is expensive; only run once per session, not per operation
5. **Future Flexibility**: Can add additional wrapping keys (hardware tokens, multi-sig) without restructuring

#### Alternatives Considered

- **Direct Derivation**: Derive encryption key directly from password each time
  - *Rejected*: Password change requires full re-encryption; no recovery path; slow per-operation
- **Hybrid Encryption**: Use asymmetric encryption for key exchange
  - *Rejected*: Unnecessary complexity for single-user local vault; larger key sizes; slower

#### Consequences

- Slightly more complex initial implementation
- Must securely manage two keys during unlock (password-derived key and VEK)
- Vault header structure must accommodate wrapped key metadata

---

### DEC-004: Argon2id KDF Parameters

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

Use Argon2id with the following minimum parameters:
- Memory: 64 MB (65536 KB)
- Iterations: 3
- Parallelism: 4

#### Rationale

1. **Argon2id Variant**: Combines Argon2i (side-channel resistance) and Argon2p (GPU resistance)
2. **Memory-Hard**: 64 MB makes GPU/ASIC attacks expensive
3. **Balanced Performance**: ~0.5-1 second derivation time on modern devices (acceptable UX)
4. **OWASP Recommendation**: Aligns with OWASP password storage guidelines
5. **Configurable**: Parameters stored in vault header; can increase for future vaults

#### Alternatives Considered

- **scrypt**: Older memory-hard KDF
  - *Rejected*: Argon2id is newer, won Password Hashing Competition, better side-channel resistance
- **PBKDF2**: Widely supported, simple
  - *Rejected*: Not memory-hard; vulnerable to GPU attacks; requires very high iteration counts
- **Lower Argon2 Parameters**: Faster derivation
  - *Rejected*: Reduces brute-force resistance; 64 MB is reasonable for modern devices

#### Consequences

- May be slow on very old devices (document minimum requirements)
- Parameters stored in vault header (attackers know KDF cost)
- Cannot change parameters without re-wrapping VEK

---

### DEC-005: XChaCha20-Poly1305-IETF Encryption

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Critical  

#### Decision

Use XChaCha20-Poly1305-IETF for all vault data encryption.

#### Rationale

1. **Large Nonce**: 192-bit nonce vs. 96-bit for ChaCha20; reduces collision risk with random nonces
2. **Authenticated Encryption**: Poly1305 MAC provides integrity verification
3. **Stream Cipher**: Suitable for streaming encryption of large attachments
4. **No Known Weaknesses**: ChaCha20 has withstood extensive cryptanalysis
5. **libsodium Support**: First-class support with safe API

#### Alternatives Considered

- **AES-GCM**: Hardware-accelerated on many devices
  - *Rejected*: 96-bit nonce; catastrophic failure on nonce reuse; potential side-channel concerns on software implementations
- **ChaCha20-Poly1305 (original)**: Smaller nonce
  - *Rejected*: XChaCha20's extended nonce is safer for random nonce generation
- **AES-CBC + HMAC**: Construct authenticated encryption manually
  - *Rejected*: Error-prone; "encrypt-then-MAC" debates; XChaCha20-Poly1305 is simpler and safer

#### Consequences

- Slightly slower than hardware AES on devices with AES-NI (acceptable tradeoff)
- Must ensure nonce uniqueness per encryption operation
- IETF variant has specific nonce size requirements (24 bytes)

---

### DEC-006: BIP39 for Recovery Mnemonic

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

Use BIP39 standard with 24-word mnemonic phrase for vault recovery.

#### Rationale

1. **Industry Standard**: Widely implemented and understood
2. **Built-in Checksum**: BIP39 includes checksum validation
3. **Human-Readable**: Easier to transcribe and verify than raw hex/base64
4. **256-bit Entropy**: 24 words provide strong security margin
5. **Tool Compatibility**: Existing BIP39 tools can validate phrases (though not for actual recovery)

#### Alternatives Considered

- **Custom Word List**: Create AegisVault-specific wordlist
  - *Rejected*: Reinventing the wheel; BIP39 is well-tested; no security benefit
- **Shorter Phrase (12 words)**: Better UX
  - *Rejected*: 128 bits is acceptable but 256 bits provides better security margin for long-term vault
- **Raw Hex/Base64 Backup**: Simpler implementation
  - *Rejected*: Harder for users to transcribe accurately; more prone to transcription errors

#### Consequences

- Must implement BIP39 correctly (checksum, wordlist, entropy conversion)
- Users may confuse with cryptocurrency recovery phrases (documentation needed)
- 24 words is longer to write down (UX consideration)

---

### DEC-007: IndexedDB for Storage

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

Use IndexedDB as the browser storage mechanism for vault data.

#### Rationale

1. **Capacity**: Supports large storage (hundreds of MB to GB depending on browser)
2. **Binary Support**: Can store ArrayBuffer/Blob for encrypted data
3. **Async API**: Non-blocking; suitable for crypto operations
4. **Standardized**: W3C standard; available in all modern browsers
5. **Query Capability**: Can index and query encrypted metadata (IDs, types, timestamps)

#### Alternatives Considered

- **localStorage**: Simple key-value store
  - *Rejected*: 5-10 MB limit; synchronous API; string-only storage
- **FileSystem API**: File-based storage
  - *Rejected*: Deprecated; limited browser support; complex API
- **WebSQL**: SQL database in browser
  - *Rejected*: Deprecated; inconsistent browser support

#### Consequences

- Async API requires careful handling (promises, async/await)
- Browser-specific quota management
- Must handle storage pressure (quota exceeded errors)
- No direct file access (complicates backup/export design)

---

### DEC-008: Minimal Dependencies Philosophy

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Medium  

#### Decision

Minimize runtime dependencies; prefer vanilla TypeScript with selective library additions only when justified.

#### Rationale

1. **Auditability**: Fewer dependencies = smaller attack surface
2. **Bundle Size**: Smaller download; faster PWA installation
3. **Supply Chain Risk**: Reduces exposure to compromised packages
4. **Control**: Direct control over security-critical code paths
5. **Long-term Maintenance**: Fewer breaking changes from dependency updates

#### Alternatives Considered

- **React/Vue/Angular**: Full-featured UI frameworks
  - *Rejected*: Large bundle sizes; unnecessary complexity; harder to audit
- **Component Libraries**: Pre-built UI components
  - *Rejected*: Many include unnecessary features; may have security issues; bloat
- **Utility Libraries (lodash, etc.)**: Convenience functions
  - *Rejected*: Modern JavaScript/TypeScript provides most needed functionality natively

#### Consequences

- More code to write initially
- Must implement some functionality that libraries would provide
- Requires discipline to resist adding convenient but unnecessary dependencies

---

### DEC-009: Vite as Build Tool

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Medium  

#### Decision

Use Vite as the build tool and development server.

#### Rationale

1. **Fast Development**: Near-instant HMR (Hot Module Replacement)
2. **Modern**: Built on ES modules; minimal configuration
3. **Small Runtime**: Unlike Webpack, minimal runtime overhead
4. **TypeScript Support**: Native TypeScript compilation
5. **PWA Plugin**: Official Vite PWA plugin for service worker generation
6. **Production Build**: Uses Rollup for optimized production bundles

#### Alternatives Considered

- **Webpack**: Mature, widely used
  - *Rejected*: Slower builds; complex configuration; larger runtime
- **Parcel**: Zero-config bundler
  - *Rejected*: Less control over output; smaller ecosystem
- **esbuild**: Extremely fast bundler
  - *Rejected*: Still maturing; less integrated PWA support

#### Consequences

- Team must learn Vite-specific configuration
- PWA plugin requires careful configuration for offline-first behavior
- Production builds use different tooling (Rollup) than dev (esbuild)

---

### DEC-010: No Network Requests by Default

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

The application must function fully offline with no network requests required for core functionality. Any optional network features (update checks, breach checking) must be explicitly user-initiated and disabled by default.

#### Rationale

1. **Privacy**: No telemetry, tracking, or data leakage
2. **Reliability**: Works in air-gapped environments, travel, poor connectivity
3. **Security**: Reduces attack surface; no remote code execution
4. **User Trust**: Clear privacy posture; no hidden network activity
5. **Performance**: No network latency for core operations

#### Alternatives Considered

- **Optional Cloud Sync**: User-enabled cloud backup
  - *Rejected for now*: Adds complexity; potential security risks; can be added as plugin/extension later
- **Breach Checking Enabled by Default**: Convenience feature
  - *Rejected*: Privacy concern; k-anonymity approach still reveals some information; should be opt-in
- **Update Auto-Check**: Silent update notifications
  - *Rejected*: User should control when app communicates externally

#### Consequences

- PWA installation requires all assets cached upfront
- Update mechanism must be user-initiated or clearly disclosed
- Breach checking (if implemented) requires careful privacy-preserving design
- Users may expect cloud features common in other password managers

---

### DEC-011: Simple Mode and Advanced Mode UI

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: Medium  

#### Decision

Implement two UI modes: Simple Mode (beginners) and Advanced Mode (experienced users), both using identical underlying security.

#### Rationale

1. **Accessibility**: Beginners not overwhelmed by technical details
2. **Flexibility**: Power users can access advanced features
3. **Same Security**: Both modes use same crypto/storage; only UI differs
4. **Progressive Disclosure**: Users can start simple, advance later
5. **Reduced Support Burden**: Clear separation of essential vs. optional features

#### Alternatives Considered

- **Single Unified UI**: One interface for all users
  - *Rejected*: Either too complex for beginners or too limited for experts
- **Feature Flags**: Per-feature toggles
  - *Rejected*: Too many options confuse users; hard to test all combinations
- **Separate Applications**: Different apps for different user types
  - *Rejected*: Code duplication; maintenance burden; security divergence risk

#### Consequences

- Must maintain two UI variants
- Settings/preferences must track mode selection
- Documentation must address both modes
- Testing must cover both modes

---

### DEC-012: Versioned Vault Format

**Date**: Phase 0  
**Status**: Accepted  
**Impact**: High  

#### Decision

Implement versioned vault format with explicit format version and schema version fields, enabling future migrations without data loss.

#### Rationale

1. **Crypto Upgrades**: Can migrate to new KDF/encryption algorithms
2. **Schema Evolution**: Can add/change data models without breaking old vaults
3. **Rollback Safety**: Can maintain compatibility with previous versions during transition
4. **Explicit Migration**: User-aware migrations; no silent format changes
5. **Future-Proof**: Enables long-term vault sustainability

#### Alternatives Considered

- **Single Fixed Format**: One format forever
  - *Rejected*: Cannot improve crypto or add features without breaking compatibility
- **Implicit Versioning**: Detect format by structure
  - *Rejected*: Error-prone; ambiguous; explicit is better
- **External Migration Tool**: Separate tool for format upgrades
  - *Rejected*: Integrated migration is safer; users may lose data with external tools

#### Consequences

- Must design migration framework from the start
- Each version must be documented
- Must test migrations thoroughly (including rollback)
- Format version stored in plaintext header

---

## Future Decisions (To Be Made)

These decisions will be made in subsequent phases:

| ID | Topic | Phase | Status |
|----|-------|-------|--------|
| DEC-F01 | UI Framework (vanilla vs. minimal framework) | 1.1 | Pending |
| DEC-F02 | State Management Approach | 1.1 | Pending |
| DEC-F03 | Attachment Streaming Implementation | 1.13 | Pending |
| DEC-F04 | k-Anonymity Breach Check Protocol | 1.10 | Pending |
| DEC-F05 | Tauri IPC Bridge Design | 2.1 | Pending |
| DEC-F06 | Mobile Biometric Integration | 3.1 | Pending |

---

## Decision Template

For future decisions, use this template:

```markdown
### DEC-XXX: [Title]

**Date**: [Phase X.X]  
**Status**: [Proposed | Accepted | Rejected | Superseded]  
**Impact**: [Low | Medium | High | Critical]  

#### Decision

[What was decided]

#### Rationale

[Why this decision was made]

#### Alternatives Considered

- [Alternative 1]: [Why rejected]
- [Alternative 2]: [Why rejected]

#### Consequences

[What follows from this decision]
```

---

*Last Updated: Phase 0 - Initial Decisions*
