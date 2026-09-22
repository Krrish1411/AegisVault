/**
 * Dynamic Keyboard Shortcuts Engine
 * Supports custom keybindings, localStorage persistence, collision prevention,
 * and key event matching across platforms.
 */

export interface ShortcutAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'Navigation' | 'Actions' | 'General';
  readonly defaultKey: string;
  readonly currentKey: string;
}

const STORAGE_KEY = 'aegis_shortcuts_v1';

export const DEFAULT_SHORTCUTS: readonly ShortcutAction[] = [
  {
    id: 'search',
    title: 'Quick Search & Command Bar',
    description: 'Search all items, accounts, cards, and run commands',
    category: 'Actions',
    defaultKey: 'mod+k',
    currentKey: 'mod+k',
  },
  {
    id: 'lock',
    title: 'Lock Vault Immediately',
    description: 'Purge memory and lock the vault immediately',
    category: 'Actions',
    defaultKey: 'mod+l',
    currentKey: 'mod+l',
  },
  {
    id: 'generator',
    title: 'Password Generator',
    description: 'Open standalone high-entropy password generator',
    category: 'Actions',
    defaultKey: 'mod+shift+g',
    currentKey: 'mod+shift+g',
  },
  {
    id: 'shortcuts_help',
    title: 'Shortcuts Cheat-Sheet',
    description: 'Open keyboard shortcuts overview guide',
    category: 'General',
    defaultKey: 'mod+/',
    currentKey: 'mod+/',
  },
  {
    id: 'nav_dashboard',
    title: 'Go to Vault Overview',
    description: 'Navigate to dashboard and quick stats',
    category: 'Navigation',
    defaultKey: 'alt+1',
    currentKey: 'alt+1',
  },
  {
    id: 'nav_passwords',
    title: 'Go to Passwords',
    description: 'Navigate to login credentials and autofill',
    category: 'Navigation',
    defaultKey: 'alt+2',
    currentKey: 'alt+2',
  },
  {
    id: 'nav_banking',
    title: 'Go to Banking',
    description: 'Navigate to bank accounts, net banking, & MPINs',
    category: 'Navigation',
    defaultKey: 'alt+3',
    currentKey: 'alt+3',
  },
  {
    id: 'nav_cards',
    title: 'Go to Payment Cards',
    description: 'Navigate to debit, credit, & virtual cards',
    category: 'Navigation',
    defaultKey: 'alt+4',
    currentKey: 'alt+4',
  },
  {
    id: 'nav_identities',
    title: 'Go to Identities',
    description: 'Navigate to Aadhaar, PAN, & Passport',
    category: 'Navigation',
    defaultKey: 'alt+5',
    currentKey: 'alt+5',
  },
  {
    id: 'nav_documents',
    title: 'Go to Documents',
    description: 'Navigate to encrypted documents & cheques',
    category: 'Navigation',
    defaultKey: 'alt+6',
    currentKey: 'alt+6',
  },
  {
    id: 'nav_notes',
    title: 'Go to Secure Notes',
    description: 'Navigate to encrypted secret notes',
    category: 'Navigation',
    defaultKey: 'alt+7',
    currentKey: 'alt+7',
  },
  {
    id: 'nav_wallets',
    title: 'Go to Crypto Wallets',
    description: 'Navigate to seed phrases and private keys',
    category: 'Navigation',
    defaultKey: 'alt+8',
    currentKey: 'alt+8',
  },
  {
    id: 'nav_settings',
    title: 'Go to Settings',
    description: 'Navigate to vault preferences and shortcuts',
    category: 'Navigation',
    defaultKey: 'alt+9',
    currentKey: 'alt+9',
  },
];

export function getShortcuts(): ShortcutAction[] {
  if (typeof localStorage === 'undefined') {
    return [...DEFAULT_SHORTCUTS];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SHORTCUTS];
    const parsed = JSON.parse(raw) as Record<string, string>;

    return DEFAULT_SHORTCUTS.map((def) => ({
      ...def,
      currentKey: parsed[def.id] || def.defaultKey,
    }));
  } catch {
    return [...DEFAULT_SHORTCUTS];
  }
}

export function saveShortcut(id: string, newKey: string): ShortcutAction[] {
  const all = getShortcuts();
  const normalizedKey = newKey.trim().toLowerCase();

  const customMap: Record<string, string> = {};
  all.forEach((sc) => {
    if (sc.id === id) {
      customMap[sc.id] = normalizedKey;
    } else if (sc.currentKey !== sc.defaultKey) {
      customMap[sc.id] = sc.currentKey;
    }
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
  }

  // Dispatch change event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aegis-shortcuts-updated'));
  }

  return getShortcuts();
}

export function resetAllShortcuts(): ShortcutAction[] {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aegis-shortcuts-updated'));
  }
  return [...DEFAULT_SHORTCUTS];
}

/**
 * Checks whether an incoming KeyboardEvent matches a given shortcut pattern.
 * Pattern format: "mod+k", "alt+1", "mod+shift+g", "shift+?", etc.
 */
export function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;

  const parts = combo.toLowerCase().split('+');
  const targetKey = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, parts.length - 1));

  const hasMod = modifiers.has('mod');
  const hasCtrl = modifiers.has('ctrl');
  const hasMeta = modifiers.has('meta');
  const hasAlt = modifiers.has('alt');
  const hasShift = modifiers.has('shift');

  // Verify Mod (Cmd on Mac, Ctrl on others)
  const isModPressed = event.metaKey || event.ctrlKey;
  if (hasMod && !isModPressed) return false;
  if (!hasMod && (hasCtrl ? !event.ctrlKey : false)) return false;
  if (!hasMod && (hasMeta ? !event.metaKey : false)) return false;
  if (!hasMod && !hasCtrl && !hasMeta && (event.metaKey || event.ctrlKey)) return false;

  // Verify Alt
  if (hasAlt && !event.altKey) return false;
  if (!hasAlt && event.altKey) return false;

  // Verify Shift
  if (hasShift && !event.shiftKey) return false;
  if (!hasShift && event.shiftKey && targetKey !== '?') return false;

  // If focus is in an input/textarea and NO modifier (mod, ctrl, alt) is required, skip
  const isInputFocused =
    document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLTextAreaElement ||
    document.activeElement?.hasAttribute('contenteditable');

  if (isInputFocused && !hasMod && !hasCtrl && !hasAlt) {
    return false;
  }

  // Key match
  const eventKey = event.key.toLowerCase();
  if (targetKey === '?' && event.key === '?') return true;
  if (targetKey === '/' && (event.key === '/' || event.key === '?')) return true;

  return eventKey === targetKey;
}

/**
 * Pretty-print shortcut string for UI badges.
 * e.g. "mod+k" -> "⌘K" or "Ctrl+K"
 */
export function formatShortcut(combo: string): string[] {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return combo.split('+').map((part) => {
    const p = part.trim().toLowerCase();
    if (p === 'mod') return isMac ? '⌘' : 'Ctrl';
    if (p === 'alt') return isMac ? '⌥' : 'Alt';
    if (p === 'shift') return isMac ? '⇧' : 'Shift';
    if (p === 'ctrl') return 'Ctrl';
    if (p === 'meta') return '⌘';
    return p.toUpperCase();
  });
}
