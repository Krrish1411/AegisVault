import { create } from 'zustand';

export type SessionStateStatus = 'uninitialized' | 'locked' | 'unlocked';

interface SessionState {
  status: SessionStateStatus;
  vaultName: string | null;
  lastActiveTimestamp: number;
  autoLockMinutes: number; // 1, 5, 10, 15, 30, 0 (Never)
  lockOnVisibilityHidden: boolean;
  clipboardClearSeconds: number; // 10, 20, 30, 60, 0 (Never)

  setStatus: (status: SessionStateStatus) => void;
  setVaultName: (name: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setLockOnVisibilityHidden: (enabled: boolean) => void;
  setClipboardClearSeconds: (seconds: number) => void;
  recordActivity: () => void;
  lock: () => void;
  unlock: (vaultName?: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'uninitialized',
  vaultName: null,
  lastActiveTimestamp: Date.now(),
  autoLockMinutes: 5,
  lockOnVisibilityHidden: false,
  clipboardClearSeconds: 20,

  setStatus: (status) => set({ status, lastActiveTimestamp: Date.now() }),
  setVaultName: (vaultName) => set({ vaultName }),
  setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
  setLockOnVisibilityHidden: (lockOnVisibilityHidden) => set({ lockOnVisibilityHidden }),
  setClipboardClearSeconds: (clipboardClearSeconds) => set({ clipboardClearSeconds }),
  recordActivity: () => set({ lastActiveTimestamp: Date.now() }),

  lock: () => {
    set({
      status: 'locked',
      lastActiveTimestamp: Date.now(),
    });
  },

  unlock: (vaultName) => {
    set((state) => ({
      status: 'unlocked',
      vaultName: vaultName ?? state.vaultName,
      lastActiveTimestamp: Date.now(),
    }));
  },

  reset: () => {
    set({
      status: 'uninitialized',
      vaultName: null,
      lastActiveTimestamp: Date.now(),
    });
  },
}));
