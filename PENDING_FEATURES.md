# AegisVault — Pending & Future Features Roadmap

This document outlines the architectural blueprints, technical specifications, and user stories for upcoming advanced features planned for AegisVault.

---

## 1. Passkey Support (WebAuthn / FIDO2)

### Overview
Enable users to create, store, manage, and authenticate with **Passkeys** (FIDO2 / WebAuthn asymmetric credentials), eliminating passwords entirely in favor of phishing-resistant public-key cryptography.

### Architecture & Technical Design
1. **Cryptographic Primitives**:
   - Asymmetric keypair generation: ECDSA with curve P-256 (`ES256`, alg `-7`) or Ed25519 (`EdDSA`, alg `-8`).
   - Private keys are encrypted using XChaCha20-Poly1305 with the vault master key before persistence to IndexedDB.
   - Public keys and credential IDs are stored as Base64URL-encoded strings.

2. **WebAuthn Integration**:
   - `navigator.credentials.create()` interceptor to capture passkey creation ceremonies from websites.
   - `navigator.credentials.get()` ceremony to generate client signatures:
     $$\text{Signature} = \text{Sign}_{K_{\text{private}}}(\text{authenticatorData} \parallel \text{clientDataJSON})$$
   - Support for the **PRF (Pseudo-Random Function) WebAuthn extension** for hardware-bound cryptographic key derivation.

3. **Vault Item Schema**:
   ```typescript
   export interface PasskeyPayload {
     readonly relyingPartyId: string; // e.g. "github.com"
     readonly relyingPartyName: string;
     readonly credentialId: string; // Base64URL credential handle
     readonly privateKeyPkcs8: string; // Encrypted PKCS#8 private key
     readonly publicKeySpki: string; // Public SPKI in Base64URL
     readonly userHandle: string; // User ID binary handle
     readonly userName: string; // e.g. "krish@example.com"
     readonly userDisplayName?: string;
     readonly signCount: number;
     readonly algorithm: number; // -7 (ES256) or -8 (EdDSA)
     readonly transports?: readonly ('internal' | 'usb' | 'nfc' | 'ble' | 'hybrid')[];
     readonly createdAt: string;
   }
   ```

4. **User Experience**:
   - Passkey section in item detail sheets displaying RP ID, Credential ID, Creation Date, and Sign Count.
   - One-click export and import of Passkeys compliant with the FIDO Alliance Passkey Exchange Format (PEF).

---

## 2. Scheduled Encrypted Auto-Backups

### Overview
Automatic, zero-knowledge local backups of the encrypted vault to prevent data loss without relying on cloud infrastructure or centralized servers.

### Architecture & Technical Design
1. **Backup Triggers**:
   - **Time-Based Schedule**: Configurable frequency: Daily, Weekly, or Monthly.
   - **Event-Driven**: Automatic snapshot triggered whenever more than 10 modifications occur.
   - **Pre-Update Snapshot**: Automatic safety backup before running migrations, importing external CSVs, or purging records.

2. **Storage Targets**:
   - **Local File System Access API** (`window.showSaveFilePicker` / `window.showDirectoryPicker`) for direct desktop synchronization into a user-selected folder (e.g. `~/Documents/AegisVault-Backups`).
   - **Browser OPFS (Origin Private File System)**: Persistent sandboxed file storage that survives normal cache clearing.
   - **Fallback Browser Download**: Automated prompt for `.aegisvault` download file when File System Access API is unavailable.

3. **Backup Envelope & Encryption**:
   - Format: Standard encrypted AegisVault snapshot (`.aegisvault`).
   - Filename format: `AegisVault-Backup-{vault-name}-{YYYY-MM-DD-HHmmss}.aegisvault`.
   - Retention policy: Keeps the last $N$ backups (e.g., 5 rolling backups), automatically pruning older files.

4. **User Experience**:
   - Settings > Backup & Storage > "Automated Backups" toggle.
   - Directory picker button to select destination folder.
   - Backup health indicator in Security Center ("Last backup: 2 hours ago").

---

## 3. Masked Email / Email Alias Integration

### Overview
Allow users to generate disposable, unique email forwarders (aliases) with one click when registering new logins, keeping their real email address concealed from data brokers, marketing lists, and breach dumps.

### Architecture & Technical Design
1. **Provider Adapters**:
   - Modular plugin architecture supporting multiple email alias providers:
     - **SimpleLogin** (Proton): `https://app.simplelogin.io/api/`
     - **Addy.io** (formerly AnonAddy): `https://app.addy.io/api/v1/`
     - **DuckDuckGo Email Protection**: `https://quack.duckduckgo.com/api/email/`
     - **Custom Self-Hosted Forwarder**: Generic REST webhook endpoint.

2. **Credential Management**:
   - Provider API tokens are saved in the user's encrypted vault settings (`settings.emailAliasProviderConfig`).
   - Zero telemetry: API calls are sent directly from the client's browser to the provider endpoint without intermediary proxies.

3. **Integration Flow**:
   - Inside `AddEditPasswordModal.tsx`, alongside the username field:
     - Button: **"Generate Masked Email"** (`Sparkles` icon).
     - Options for alias domain (e.g. `@slmail.me`, `@duck.com`, `@addy.io`) and note prefix.
     - Auto-fills the generated address into the username field and stores alias metadata in the login record.
   - Ability to disable or toggle forwarding directly from the credential detail sheet.

---

## 4. Chrome & Firefox Extension Companion

### Overview
A Manifest V3 browser companion extension enabling seamless 1-click credential autofill, inline field badge icons, and automatic password capture on web pages while communicating securely with the local AegisVault instance.

### Architecture & Technical Design
1. **Extension Architecture (Manifest V3)**:
   - **Background Service Worker**: Manages crypto operations and communication channels.
   - **Content Scripts**: Injected into web pages to detect login/registration forms, credit card fields, and TOTP inputs.
   - **Popup / Action UI**: Compact version of the AegisVault search and item list.
   - **Autofill Overlay**: Native in-field dropdown badge displaying matched accounts for the current domain.

2. **Inter-Process Communication (IPC)**:
   - **Option A (Tab / Window Messaging)**: `window.postMessage` with strict Origin verification (`https://vault.local` or user's self-hosted domain).
   - **Option B (WebSockets / Localhost Bridge)**: Secure local WebSocket server with ephemeral TLS certificates and challenge-response authentication.
   - **Option C (Shared IndexedDB / WASM Engine)**: Extension packages the same Sodium crypto bundle and decrypts the local vault directly using the user's master key.

3. **Security Constraints**:
   - Strict Content Security Policy (CSP) forbidding `eval()` and remote scripts.
   - Form autofill requires active user gesture or explicit click (no automatic form filling on page load to prevent iframe harvesting).
   - Domain matching uses the Public Suffix List (PSL) to prevent subdomain credential leakage.
