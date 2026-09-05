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

    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }
}

export const webVisibility = new WebVisibilityPort();
