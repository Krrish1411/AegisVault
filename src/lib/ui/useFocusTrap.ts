import * as React from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps Tab and Shift+Tab navigation within containerRef while active.
 * Restores focus to the previously focused element upon deactivation.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive) return;

    // Store element that had focus prior to opening modal
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element inside the container or container itself
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    let cleanup: (() => void) | undefined;
    if (focusableElements.length > 0) {
      // Small timeout allows animation/portal mount
      const timer = setTimeout(() => {
        focusableElements[0]?.focus();
      }, 50);
      cleanup = () => clearTimeout(timer);
    } else {
      container.focus();
    }
    return cleanup;
  }, [isActive, containerRef]);

  React.useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null); // only visible elements

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusable[0]!;
      const lastElement = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === container) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, containerRef]);

  // Restore focus on unmount or deactivation
  React.useEffect(() => {
    return () => {
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);
}
