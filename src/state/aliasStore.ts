import { create } from 'zustand';

export interface StandaloneAlias {
  id: string;
  alias: string;
  tag: string;
  createdAt: string;
  notes?: string | undefined;
}

interface AliasState {
  forwardingEmail: string;
  customAliases: StandaloneAlias[];
  setForwardingEmail: (email: string) => void;
  addCustomAlias: (alias: string, tag?: string, notes?: string) => StandaloneAlias;
  removeCustomAlias: (id: string) => void;
}

export const FORWARDING_EMAIL_STORAGE_KEY = 'aegis_duck_forwarding_email';
export const CUSTOM_ALIASES_STORAGE_KEY = 'aegis_duck_custom_aliases';

const getInitialForwardingEmail = (): string => {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(FORWARDING_EMAIL_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }
  return '';
};

const getInitialCustomAliases = (): StandaloneAlias[] => {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CUSTOM_ALIASES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
};

export const useAliasStore = create<AliasState>((set) => ({
  forwardingEmail: getInitialForwardingEmail(),
  customAliases: getInitialCustomAliases(),

  setForwardingEmail: (email: string) => {
    const trimmed = email.trim();
    set({ forwardingEmail: trimmed });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(FORWARDING_EMAIL_STORAGE_KEY, trimmed);
      } catch {
        // ignore
      }
    }
  },

  addCustomAlias: (alias: string, tag = 'General', notes?: string) => {
    const newEntry: StandaloneAlias = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `alias-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      alias: alias.trim(),
      tag: tag.trim() || 'General',
      createdAt: new Date().toISOString(),
      notes: notes?.trim() || undefined,
    };

    set((state) => {
      const updated = [newEntry, ...state.customAliases];
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(CUSTOM_ALIASES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { customAliases: updated };
    });

    return newEntry;
  },

  removeCustomAlias: (id: string) => {
    set((state) => {
      const updated = state.customAliases.filter((a) => a.id !== id);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(CUSTOM_ALIASES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { customAliases: updated };
    });
  },
}));
