# AegisVault — UI/UX Design System & Screen Blueprint

## 1. Design direction

AegisVault should feel like a premium personal security instrument rather than a developer dashboard.

Keywords:
- quiet
- precise
- premium
- minimal
- modern
- polished
- tactile
- confident
- private
- calm

Avoid:
- hacker aesthetics
- neon-green “cybersecurity” clichés
- excessive glassmorphism
- noisy gradients
- dense tables everywhere
- modal overload
- technical jargon in Simple Mode
- cartoonish security illustrations

## 2. Visual language

### Color roles

Use semantic design tokens rather than hard-coded colors throughout components.

Core roles:
- background
- surface
- surface-elevated
- surface-subtle
- text-primary
- text-secondary
- text-muted
- border
- accent
- success
- warning
- danger
- focus

Default theme should be a sophisticated neutral system with an understated accent.

Provide light and dark modes, but keep the contrast model consistent.

### Typography

No remote fonts.

Use a strong system font stack with careful weights. Typography should feel editorial, not “app default.”

Recommended hierarchy:
- Display
- Page title
- Section title
- Card title
- Body
- Supporting
- Caption

### Shape

Use medium corner radii consistently. Avoid pill-shaped everything.

### Motion

Motion is subtle and functional:
- 120–220ms micro-interactions
- 200–320ms panels/sheets
- no decorative animation during security actions

Respect `prefers-reduced-motion`.

## 3. Layout system

Desktop default:
- persistent left navigation
- compact top utility region
- content max width around 1200–1400px
- generous whitespace

Tablet:
- collapsible sidebar

Mobile:
- bottom navigation for the highest-frequency actions
- sheets/drawers for secondary actions
- one-handed controls

## 4. App shell

```text
┌───────────────────────────────────────────────────────────┐
│ AegisVault       Search                     Lock   Avatar │
├───────────────┬───────────────────────────────────────────┤
│               │                                           │
│  Vault        │            Main content                   │
│  Passwords    │                                           │
│  Bank         │                                           │
│  Cards        │                                           │
│  IDs          │                                           │
│  Documents    │                                           │
│  Notes        │                                           │
│  Security     │                                           │
│               │                                           │
│ Settings      │                                           │
└───────────────┴───────────────────────────────────────────┘
```

The shell should communicate: “You are inside your private space.”

## 5. Welcome

Goal: establish trust without a wall of security vocabulary.

Hero copy concept:
“Your private data. Under your control.”

Three concise promises:
- stays on your device
- works offline
- protected by modern cryptography

Actions:
- Create my vault
- Restore a vault

A small “How protection works” link opens a simple explanation.

## 6. Create vault

Progressive disclosure:
1. Vault name
2. Master password
3. Confirm password
4. Password quality feedback
5. Recovery setup
6. Final confirmation

Never punish a strong passphrase because it lacks arbitrary character categories.

## 7. Unlock

Minimal screen.

Elements:
- vault identity
- master password input
- reveal/hide button
- unlock button
- recovery route
- subtle offline state indicator when appropriate

Do not create “security theatre” such as fake scanning bars.

## 8. Dashboard

The dashboard is a calm overview, not a KPI screen.

Suggested structure:

```text
Good morning
Your vault is protected.

[ 42 items ] [ 3 need attention ]

Security snapshot
───────────────
Weak passwords          3  Review
Reused passwords        2  Review
Old passwords           4  Review
Recovery                Verified
Backup                  Available

Recent items
───────────────
Google          Work
HDFC Bank       Banking
Passport        Identity

Quick actions
[ Add password ] [ Generate password ] [ Create backup ]
```

## 9. List screens

Every list should support:
- search
- sort
- optional filter
- favorite
- archive
- secure reveal controls

Rows/cards should not visually expose secrets by default.

Use metadata chips such as category, last updated, favorite, warning state.

## 10. Item detail

Sensitive fields use hidden-by-default presentation.

Example:

```text
Google
──────────────────────────
Username   user@example.com     [copy]
Password   ••••••••••••••••     [reveal] [copy]
Website    accounts.google.com

Security
Good password · Not reused

Notes
••••••••••••••••••••••••

[Edit] [More]
```

Revealing a secret should feel deliberate and reversible.

## 11. Add/edit flow

Use a focused form sheet/page with:
- clear field labels
- short helper text only where it improves decisions
- reveal toggles for sensitive inputs
- generator integration
- save/cancel

Do not show every possible field for every item type.

## 12. Security Center

This is a first-class product surface.

Top card:
“Vault Protected”

Then a clean priority list:
- 3 weak passwords
- 2 reused passwords
- 4 old passwords
- Recovery verified
- Backup available
- Auto-lock 5 minutes

Each issue has one clear action.

Advanced Mode can reveal deeper diagnostic information.

## 13. Search

Search should feel instant while unlocked.

Global search command palette:
- keyboard shortcut on desktop
- prominent search on mobile
- filters by type/tag/folder

Never persist search terms containing secrets beyond the current transient interaction.

## 14. Generator

Generator should feel like a tool, not a configuration dump.

Primary control: generated secret preview.

Secondary controls:
- length
- type
- character options
- ambiguous-character toggle
- minimum counts

Defaults:
- 20-character password
- secure password mode

Support passphrase and PIN modes.

## 15. Recovery UI

Recovery is serious but not frightening.

Use a focused sequence with a “do not photograph/share/store in cloud” reminder.

Display only what is necessary.

Verification asks for three randomly chosen words after the phrase has been shown.

## 16. Dangerous actions

For delete vault / destroy data / restore backup:
- clearly identify what will happen
- separate destructive action visually
- require intentional confirmation
- never use ambiguous button labels like “Continue” for destructive confirmation

## 17. Advanced Mode

Advanced Mode is not a “developer mode.” It is a power-user surface.

Show:
- vault manager
- multiple vaults
- nested folders
- custom fields/types
- diagnostics
- format/crypto information
- advanced backup/export tools
- sharing controls

The visual language remains the same.

## 18. Empty states

Never say “No data.”

Use useful next actions:

Passwords:
“Your password vault is ready.”
“Add your first login or generate a strong password.”

Documents:
“Your private document space is empty.”
“Add a document when you’re ready.”

## 19. Accessibility

Must include:
- keyboard navigation
- visible focus states
- screen-reader labels
- sufficient contrast
- reduced motion
- touch targets appropriate for mobile
- no color-only security meaning

## 20. Component architecture

Build a small component vocabulary:

- Button
- IconButton
- Input
- SecretInput
- PasswordField
- Select
- Combobox
- Tabs
- Card
- ListRow
- Badge
- StatusIndicator
- EmptyState
- ConfirmDialog
- Sheet
- Toast
- CommandPalette
- ProgressBar
- SecurityScore
- SecretReveal
- CopyButton
- FileDropzone

Customize primitives instead of creating hundreds of one-off components.
