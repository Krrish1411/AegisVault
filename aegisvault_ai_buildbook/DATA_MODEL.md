# AegisVault — Data Model & Vault Format

## 1. Model principles

Everything inside the logical vault is sensitive by default.

Do not assume titles, folder names, tags, URLs, or item type are safe to expose persistently. Unless the format explicitly requires metadata outside the encrypted payload, keep it encrypted.

## 2. Core entities

```text
Vault
 ├── VaultMetadata
 ├── Folders
 │    └── child folders
 ├── Items
 │    ├── fields
 │    ├── tags
 │    ├── history
 │    └── attachments
 └── Audit Events
```

## 3. Vault entity

Conceptual fields:

- id
- displayName
- createdAt
- updatedAt
- formatVersion
- cryptoProfile
- settings
- folders
- items
- attachments manifest
- audit events

Dates are domain data and are encrypted with the vault.

## 4. Item envelope

Every item has:
- id
- type
- title
- favorite
- archived
- folderId
- tags
- createdAt
- updatedAt
- type-specific payload
- optional password history
- optional attachments

The UI should map generic records to specialized forms.

## 5. Built-in item types

Required roadmap types:
- login
- email
- application
- bank_login
- bank_account
- bank_profile
- debit_card
- credit_card
- upi
- upi_pin
- atm_pin
- identity
- passport
- driving_license
- pan
- aadhaar
- voter_id
- tax_id
- insurance
- secure_note
- totp
- api_key
- ssh_key
- license_key
- wallet_seed
- private_key
- emergency_contact
- document
- custom

## 6. Custom fields

Custom fields need an explicit type system:

- text
- secret
- number
- date
- boolean
- url
- email
- phone
- multiline
- otp (where appropriate)

Never assume custom fields are non-sensitive.

## 7. Versioning

Every persisted vault and export contains:

```ts
{
  formatVersion: 1,
  cryptoProfile: 'aegis-v1'
}
```

Unsupported future versions must fail closed with a clear message.

## 8. Serialization

Select one canonical serialization format and freeze it as part of the vault format specification before declaring v1 stable.

Rules:
- deterministic output where useful
- explicit encoding
- strict validation on read
- no silent coercion
- no prototype-pollution-prone object merging

## 9. Password history

Password history is itself encrypted vault data.

Each entry stores enough information to support:
- view previous password
- restore previous password
- delete history

UI should default to newest entries and require deliberate reveal.

## 10. Attachments

Attachment metadata is encrypted.

Recommended metadata:
- attachment id
- original filename
- media type
- size
- createdAt
- modifiedAt
- encrypted content reference

The attachment bytes are authenticated and encrypted.

For large files use a streaming authenticated construction such as libsodium secretstream where the library/runtime combination supports it reliably.

## 11. Attachment limits

Initial product limits:
- single file: 50 MB
- recommended total: 500 MB

UI should show usage and warn before large imports.

Do not assume all browsers have unlimited quota.

## 12. Audit log

Encrypted local events may include:
- item created
- item edited
- item deleted
- vault unlocked
- vault locked
- backup created
- backup restored
- password changed
- recovery used
- recovery verified
- security scan completed
- migration completed

Never include secret values.

## 13. Recovery metadata

Persist only what is required to validate/use the recovery mechanism.

Persist:
- recovery mechanism version
- salts/parameters required by it
- wrapped Vault Key material
- verification state/date

Never persist the actual recovery phrase.
