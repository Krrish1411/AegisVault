/**
 * Controlled PWA Service Worker Registration & Update Management.
 * Guarantees zero silent background code replacement without user consent.
 */

let registration: ServiceWorkerRegistration | null = null;

export function registerPwaServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;

        // Check if there's already a worker waiting
        if (reg.waiting) {
          notifyUpdateAvailable(reg.waiting);
        }

        // Listen for new updates found
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdateAvailable(installingWorker);
              }
            });
          }
        });
      })
      .catch(() => {
        // Safe offline fallback
      });
  });
}

function notifyUpdateAvailable(worker: ServiceWorker): void {
  const event = new CustomEvent('pwa-update-available', {
    detail: { worker },
  });
  window.dispatchEvent(event);
}

export function applyPwaUpdate(worker?: ServiceWorker): void {
  const targetWorker = worker || registration?.waiting;
  if (targetWorker) {
    targetWorker.postMessage({ type: 'SKIP_WAITING' });
    targetWorker.addEventListener('statechange', () => {
      if (targetWorker.state === 'activated') {
        window.location.reload();
      }
    });
  } else {
    window.location.reload();
  }
}
