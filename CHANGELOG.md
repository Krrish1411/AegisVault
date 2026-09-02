# AegisVault - Changelog

This document records meaningful changes to the AegisVault project, following the principles of [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Phase 0: Foundation (In Progress)

#### Added

- **PROJECT_BLUEPRINT.md**: Comprehensive product architecture and roadmap documentation
  - Product vision and core principles
  - Platform strategy (Web → Desktop → Mobile)
  - Technology stack decisions
  - Architecture overview with module definitions
  - Security architecture (key hierarchy, envelope encryption)
  - Storage model (IndexedDB structure)
  - UI modes (Simple/Advanced)
  - Backup & recovery direction
  - Phased roadmap through Head 5

- **SECURITY_MODEL.md**: Complete security architecture documentation
  - Threat model with assets, actors, and attack scenarios
  - Trust boundaries diagram and assumptions
  - Cryptographic specifications (Argon2id, XChaCha20-Poly1305-IETF, BIP39)
  - Key hierarchy and envelope encryption details
  - Storage security requirements
  - Memory security limitations and mitigations
  - Backup format specification
  - Recovery system security
  - Password generator security requirements
  - PWA update security strategy
  - Documented security limitations

- **DECISIONS.md**: Technical and security decision log
  - DEC-001: Web-First Development Strategy
  - DEC-002: libsodium for Cryptography
  - DEC-003: Envelope Encryption Architecture
  - DEC-004: Argon2id KDF Parameters
  - DEC-005: XChaCha20-Poly1305-IETF Encryption
  - DEC-006: BIP39 for Recovery Mnemonic
  - DEC-007: IndexedDB for Storage
  - DEC-008: Minimal Dependencies Philosophy
  - DEC-009: Vite as Build Tool
  - DEC-010: No Network Requests by Default
  - DEC-011: Simple Mode and Advanced Mode UI
  - DEC-012: Versioned Vault Format
  - Template for future decisions

- **PROGRESS.md**: Development tracking document
  - Current phase status
  - Completed/in-progress/not-started sections
  - Known issues and security concerns
  - Next task identification

#### Changed

- Repository initialized for controlled development
- Documentation-first approach established before implementation

#### Security

- Documented threat model covering:
  - Stolen encrypted backups
  - Unauthorized storage access
  - Offline password guessing
  - Tampering attacks
  - Memory extraction risks
  - Keylogging/malware limitations
  - Browser extension risks
  - Compromised OS/browser scenarios

- Defined cryptographic requirements:
  - libsodium as sole crypto library
  - Argon2id with 64MB memory, 3 iterations, parallelism 4
  - XChaCha20-Poly1305-IETF for authenticated encryption
  - 256-bit random Vault Encryption Key
  - 128-bit random salts
  - 192-bit random nonces per operation
  - BIP39 24-word recovery mnemonics

- Established security constraints:
  - No plaintext secrets in storage
  - Envelope encryption architecture
  - Key separation and domain separation
  - Versioned vault format for crypto upgrades
  - Minimized secret lifetime in memory

---

## [Not Yet Started]

### Head 1: Web/PWA Development

The following phases are planned but not yet started:

#### Phase 1.1: Project Initialization
- Vite + TypeScript setup
- Basic project structure
- Development environment configuration
- Initial build pipeline

#### Phase 1.2: Crypto Layer
- libsodium integration
- Key derivation (Argon2id)
- Encryption/decryption utilities
- Random generation wrappers
- Key wrapping/unwrapping

#### Phase 1.3: Vault Engine Core
- Vault creation workflow
- Vault opening/unlock flow
- Envelope encryption implementation
- Vault header management
- Format versioning

#### Phase 1.4: Data Models & Storage
- IndexedDB schema design
- Object stores creation
- CRUD operations
- Encrypted data serialization
- Metadata handling

#### Phase 1.5: Authentication Flow
- Master password entry UI
- Unlock session management
- Auto-lock timer
- Lock functionality
- Clipboard clearing

#### Phase 1.6: UI Foundation
- Application shell
- Navigation structure
- Simple Mode layout
- Advanced Mode layout
- Settings framework

#### Phase 1.7: Password Generator
- Secure random password generation
- Passphrase generation
- PIN generation
- Character set configuration
- Strength indicator

#### Phase 1.8: Item Management
- Create/Edit/Delete items
- Folder management
- Nested folder support
- Tag system
- Custom fields (Advanced Mode)

#### Phase 1.9: Search Functionality
- Encrypted index building
- Search query processing
- Filtering by type, folder, tag
- Advanced search filters

#### Phase 1.10: Password Health Engine
- Weak password detection
- Reuse/duplicate detection
- Common pattern detection
- Password age tracking
- Health dashboard

#### Phase 1.11: Recovery System
- BIP39 mnemonic generation
- Recovery phrase display
- Word verification (3 random words)
- Recovery key wrapping
- Periodic reminder system

#### Phase 1.12: Backup & Export/Import
- Encrypted backup format
- Export workflow
- Import validation
- Tamper detection
- Migration support

#### Phase 1.13: Attachment Handling
- File upload interface
- Streaming encryption (libsodium secretstream)
- Size limits (50MB/file, 500MB total target)
- Encrypted blob storage
- Download/decryption

#### Phase 1.14: PWA Configuration
- Service worker implementation
- Offline caching strategy
- App manifest
- Update mechanism
- Install prompt

#### Phase 1.15: Security Hardening
- Code review
- Dependency audit
- Security testing
- CSP headers
- Input validation

#### Phase 1.16: Testing & Bug Fixes
- Unit tests
- Integration tests
- E2E tests
- Bug fixes
- Performance optimization

#### Phase 1.17: Documentation & Release
- User documentation
- Security documentation
- Release notes
- Version tagging
- Public release preparation

### Head 2: Desktop (Tauri 2)
### Head 3: Mobile (Capacitor/Native)
### Head 4: Advanced Security
### Head 5: Product/Business

---

## Version History

| Version | Date | Phase | Status |
|---------|------|-------|--------|
| 0.0.0 | Phase 0 | Foundation | In Progress |
| 0.1.0 | Phase 1.1 | Project Initialization | Not Started |
| 0.2.0 | Phase 1.2 | Crypto Layer | Not Started |
| 0.3.0 | Phase 1.3 | Vault Engine Core | Not Started |
| 0.4.0 | Phase 1.4 | Data Models & Storage | Not Started |
| 0.5.0 | Phase 1.5 | Authentication Flow | Not Started |
| 0.6.0 | Phase 1.6 | UI Foundation | Not Started |
| 0.7.0 | Phase 1.7 | Password Generator | Not Started |
| 0.8.0 | Phase 1.8 | Item Management | Not Started |
| 0.9.0 | Phase 1.9 | Search Functionality | Not Started |
| 1.0.0-rc1 | Phase 1.15 | Security Hardening | Not Started |
| 1.0.0 | Phase 1.17 | Initial Release | Not Started |

---

*Last Updated: Phase 0 - Documentation Created*
