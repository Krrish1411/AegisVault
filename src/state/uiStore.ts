import { create } from 'zustand';
import type { AppMode, ThemeMode } from '@/domain/vault/types';

export type ThemePalette = 'cyan' | 'proton' | 'indigo' | 'slate' | 'amber' | 'pine';

export interface ToastItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger';
  readonly durationMs?: number;
}

interface UiState {
  theme: ThemeMode;
  themePalette: ThemePalette;
  appMode: AppMode;
  activeVaultId: string; // 'all' for aggregated view or specific vaultId
  commandPaletteOpen: boolean;
  activeNavSection: string;
  toasts: readonly ToastItem[];
  vaultRevision: number;

  setTheme: (theme: ThemeMode) => void;
  setThemePalette: (palette: ThemePalette) => void;
  setAppMode: (mode: AppMode) => void;
  setActiveVaultId: (vaultId: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveNavSection: (section: string) => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  bumpVaultRevision: () => void;
  incrementVaultRevision: () => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('aegis_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  }
  return 'dark';
};

const getInitialPalette = (): ThemePalette => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('aegis_palette');
    if (saved === 'cyan' || saved === 'proton' || saved === 'indigo' || saved === 'slate' || saved === 'amber' || saved === 'pine') return saved;
  }
  return 'cyan';
};

export const useUiStore = create<UiState>((set) => ({
  theme: getInitialTheme(),
  themePalette: getInitialPalette(),
  appMode: 'simple',
  activeVaultId: 'all',
  commandPaletteOpen: false,
  activeNavSection: 'dashboard',
  toasts: [],
  vaultRevision: 0,
  bumpVaultRevision: () => set((state) => ({ vaultRevision: state.vaultRevision + 1 })),
  incrementVaultRevision: () => set((state) => ({ vaultRevision: state.vaultRevision + 1 })),

  setTheme: (theme) => {
    set({ theme });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aegis_theme', theme);
      } catch {
        // ignore
      }
    }
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  },

  setThemePalette: (themePalette) => {
    set({ themePalette });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aegis_palette', themePalette);
      } catch {
        // ignore
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themePalette);
    }
  },

  setAppMode: (appMode) => set({ appMode }),
  setActiveVaultId: (activeVaultId) => set({ activeVaultId }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setActiveNavSection: (activeNavSection) => set({ activeNavSection }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
