import * as React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useUiStore } from '@/state/uiStore';
import { useSessionStore } from '@/state/sessionStore';
import { appVaultService } from '@/application/services/AppVaultService';
import { networkGuard } from '@/lib/network/networkGuard';
import { webVisibility } from '@/platform/web/WebVisibilityPort';
import { logger } from '@/lib/logger';
import { registerPwaServiceWorker } from '@/platform/pwa/pwaService';
import { PwaUpdateBanner } from '@/features/pwa/PwaUpdateBanner';

export function App() {
  const theme = useUiStore((state) => state.theme);
  const themePalette = useUiStore((state) => state.themePalette);
  const setTheme = useUiStore((state) => state.setTheme);
  const setThemePalette = useUiStore((state) => state.setThemePalette);
  const status = useSessionStore((state) => state.status);
  const autoLockMinutes = useSessionStore((state) => state.autoLockMinutes);
  const lockOnVisibilityHidden = useSessionStore((state) => state.lockOnVisibilityHidden);
  const recordActivity = useSessionStore((state) => state.recordActivity);

  // Initialize network guard, theme, and PWA service worker on mount
  React.useEffect(() => {
    networkGuard.install({
      allowedDomains: ['api.pwnedpasswords.com', 'buymeacoffee.com', 'cdnjs.buymeacoffee.com'],
    });
    registerPwaServiceWorker();
    setTheme(theme);
    setThemePalette(themePalette);
    logger.info('AegisVault application initialized', { component: 'App' });

    return () => {
      networkGuard.uninstall();
    };
  }, [setTheme, setThemePalette, theme, themePalette]);

  // Listen for user interaction events to record activity
  React.useEffect(() => {
    const handleActivity = () => {
      recordActivity();
    };

    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('pointerdown', handleActivity);

    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
    };
  }, [recordActivity]);

  // Visibility change: lock if document is hidden and user has unlocked session
  React.useEffect(() => {
    const unsubscribe = webVisibility.onVisibilityChange((isVisible) => {
      if (!isVisible && status === 'unlocked' && lockOnVisibilityHidden) {
        logger.debug('Visibility hidden: auto-locking vault for protection', { component: 'App' });
        appVaultService.lockVault();
      }
    });
    return unsubscribe;
  }, [status, lockOnVisibilityHidden]);

  // Periodic inactivity checker
  React.useEffect(() => {
    if (status !== 'unlocked' || autoLockMinutes <= 0) return;

    const interval = setInterval(() => {
      const lastActive = useSessionStore.getState().lastActiveTimestamp;
      const elapsedMs = Date.now() - lastActive;
      const thresholdMs = autoLockMinutes * 60 * 1000;

      if (elapsedMs >= thresholdMs) {
        logger.info('Inactivity timeout reached: locking vault', { component: 'App' });
        appVaultService.lockVault();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, autoLockMinutes]);

  return (
    <>
      <RouterProvider router={router} />
      <PwaUpdateBanner />
    </>
  );
}
