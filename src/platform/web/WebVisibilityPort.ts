import type { VisibilityListener, VisibilityPort } from '../ports/VisibilityPort';

export class WebVisibilityPort implements VisibilityPort {
  isVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  }

  onVisibilityChange(listener: VisibilityListener): () => void {
    if (typeof document === 'undefined') return () => {};

    const handler = () => {
      listener(document.visibilityState === 'visible');
    };

    const systemLockHandler = () => {
      listener(false);
    };

    document.addEventListener('visibilitychange', handler);
    if (typeof window !== 'undefined') {
      window.addEventListener('aegis_system_lock', systemLockHandler);
    }

    return () => {
      document.removeEventListener('visibilitychange', handler);
      if (typeof window !== 'undefined') {
        window.removeEventListener('aegis_system_lock', systemLockHandler);
      }
    };
  }
}

export const webVisibility = new WebVisibilityPort();
