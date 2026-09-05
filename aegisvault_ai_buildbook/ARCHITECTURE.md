# AegisVault — Complete Software Architecture

## 1. Architectural shape

```text
                    ┌─────────────────────────────┐
                    │        React 19 UI          │
                    │ routes / components / UX    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Application Services    │
                    │ use-cases / orchestration   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │          Domain + Security Core         │
              │ vault model / policies / crypto ports   │
              └──────────────┬───────────────┬─────────┘
                             │               │
                  ┌──────────▼──────┐  ┌────▼───────────┐
                  │ Storage/Repo     │  │ Platform Ports │
                  │ interfaces      │  │ clipboard,     │
                  │                 │  │ clock, random  │
                  └─────────┬───────┘  └────────────────┘
                            │
                    ┌───────▼────────┐
                    │ IndexedDB/Dexie│
                    │ browser adapter │
                    └────────────────┘

Future:
Storage adapter -> Tauri/native secure storage
Platform adapter -> OS APIs
```

## 2. Directory structure

```text
src/
  app/
    App.tsx
    router.tsx
    providers/
    routes/

  features/
    onboarding/
    unlock/
    dashboard/
    passwords/
    banking/
    cards/
    identity/
    documents/
    notes/
    security-center/
    search/
    settings/
    backup/
    recovery/
    generator/
    totp/
    wallet/
    sharing/
    emergency-kit/

  application/
    services/
    use-cases/
    policies/

  domain/
    vault/
      entities/
      value-objects/
      services/
    items/
    folders/
    attachments/
    security-analysis/
    audit/

  security/
    crypto/
      CryptoProvider.ts
      SodiumCryptoProvider.ts
      aead.ts
      kdf.ts
      key-management.ts
      nonce.ts
      random.ts
      domain-separation.ts
    recovery/
    migration/
    serialization/

  storage/
    ports/
      VaultRepository.ts
      AttachmentRepository.ts
      AuditRepository.ts
    indexeddb/
      db.ts
      repositories/
      migrations/

  platform/
    ports/
      ClipboardPort.ts
      ClockPort.ts
      FilePort.ts
      SecureRandomPort.ts
      VisibilityPort.ts
    web/
      clipboard/
      files/
      visibility/

  ui/
    components/
    primitives/
    layout/
    feedback/
    forms/
    icons/

  state/
    sessionStore.ts
    uiStore.ts

  lib/
    validation/
    formatting/
    errors/

  workers/
    securityScan.worker.ts
    crypto.worker.ts

  styles/
    tokens.css
    globals.css

  test/
    fixtures/
    helpers/
```

## 3. Layer rules

### UI layer may
- render state
- call application use-cases
- show validation/errors
- hold short-lived form state

### UI layer must not
- call IndexedDB directly
- call libsodium directly
- hold long-lived decrypted vault state unnecessarily
- decide cryptographic parameters

### Application layer
Coordinates use-cases such as:
- create vault
- unlock vault
- lock vault
- create item
- update item
- delete item
- export vault
- import vault
- rotate master-password wrapping
- recover vault
- run security analysis

### Domain/security layer
Owns invariants and security-sensitive transformations.

### Storage layer
Owns serialization/persistence mechanics only.

Storage repositories receive encrypted blobs or narrowly defined metadata, not arbitrary plaintext domain entities.

## 4. Session model

Use a dedicated in-memory `UnlockedSession` containing:

- Vault Key material (wrapped in the narrowest feasible abstraction)
- decrypted domain state while unlocked
- lock timer state
- session capability/context

The session is destroyed on lock and inactivity timeout.

Avoid copying the Vault Key through React props. UI receives domain projections or capabilities, not raw key material.

## 5. Crypto service contract

```ts
export interface CryptoProvider {
  randomBytes(length: number): Uint8Array;

  deriveKeyFromPassword(input: {
    password: string;
    salt: Uint8Array;
    params: KdfParams;
  }): Promise<Uint8Array>;

  aeadEncrypt(input: {
    plaintext: Uint8Array;
    key: Uint8Array;
    aad?: Uint8Array;
  }): Uint8Array;

  aeadDecrypt(input: {
    ciphertext: Uint8Array;
    key: Uint8Array;
    aad?: Uint8Array;
  }): Uint8Array;

  deriveSubkey(input: {
    rootKey: Uint8Array;
    context: string;
    length: number;
  }): Uint8Array;
}
```

The concrete provider owns the libsodium calls. No feature imports crypto library functions directly.

## 6. Storage contract

```ts
export interface VaultRepository {
  create(container: EncryptedVaultContainer): Promise<void>;
  read(): Promise<EncryptedVaultContainer | null>;
  replaceAtomically(next: EncryptedVaultContainer): Promise<void>;
  delete(): Promise<void>;
}

export interface AttachmentRepository {
  put(id: string, encryptedBytes: AsyncIterable<Uint8Array>): Promise<void>;
  get(id: string): Promise<EncryptedAttachmentStream | null>;
  delete(id: string): Promise<void>;
}
```

The exact implementation can change, but callers should not know whether persistence is IndexedDB, filesystem, or native secure storage.

## 7. Encrypted vault container

Conceptual structure:

```ts
type EncryptedVaultContainer = {
  formatVersion: number;
  cryptoProfile: string;
  kdf: {
    algorithm: 'argon2id';
    salt: string;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
  keyWrap: {
    scheme: string;
    nonce: string;
    wrappedVaultKey: string;
  };
  payload: {
    nonce: string;
    ciphertext: string;
  };
};
```

This is a conceptual contract. The precise byte encoding must be specified and tested before a release format is declared stable.

## 8. Worker strategy

Argon2id benchmarks and potentially heavy local analysis should be moved out of the UI thread where practical.

Workers must communicate via structured messages with explicit types.

Never put secrets into worker logs.

## 9. Error strategy

Create typed error categories:

- AuthenticationFailed
- VaultNotFound
- VaultCorrupted
- UnsupportedVaultVersion
- MigrationFailed
- ImportValidationFailed
- StorageQuotaExceeded
- AttachmentTooLarge
- CryptoOperationFailed
- RecoveryVerificationFailed

UI should map errors to human-readable messages without leaking secret or internal crypto details.

## 10. Atomicity and crash safety

Every vault mutation should follow:

1. Read current valid encrypted container.
2. Decrypt/validate in memory.
3. Apply domain mutation.
4. Serialize deterministically/canonically.
5. Encrypt into a new container.
6. Validate the new container.
7. Commit atomically through storage adapter.
8. Only then consider the old version replaceable.

Migration follows the same rule with stronger backup/rollback guarantees.

## 11. Search architecture

Search happens after unlock against ephemeral decrypted data.

Do not create a persistent plaintext index.

Potential optimization later: an in-memory normalized search index rebuilt after unlock and destroyed on lock.

## 12. React architecture

Prefer feature-driven composition over a giant component tree.

Rules:
- route modules compose feature screens
- feature hooks call application services
- application services return safe view models
- components remain mostly presentational
- forms validate with schemas before invoking use-cases
- avoid global state for sensitive records

## 13. Future portability

The domain/application packages should not import `window`, `document`, IndexedDB, Tauri, Capacitor, React, or platform-specific modules.

Platform concerns are ports/adapters.

This is the architectural requirement that makes future desktop/mobile versions realistic rather than a rewrite.
