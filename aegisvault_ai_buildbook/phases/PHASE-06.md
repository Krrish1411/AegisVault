# Phase 06 — Personal Data, Banking & Cards

## Objective

Expand from passwords to sensitive personal records while preserving the same encrypted item model.

## Tasks

Implement typed forms and domain models for:
- bank login
- bank account
- bank profile
- credit card
- debit card
- UPI
- UPI PIN
- ATM PIN
- identity
- PAN
- Aadhaar
- passport
- driving licence
- voter ID
- tax ID
- insurance
- emergency contact

Support the complete field set defined by `DATA_MODEL.md` and the original product specification.

## UX rules

Sensitive values are masked by default.

Do not expose unnecessary fields on first view.

Use progressive disclosure for advanced banking/identity fields.

## Tests

Schema validation, encryption-at-rest inspection, import/export compatibility, and sensitive-field masking.

## Progress

Update `PROGRESS.md` before completion.
