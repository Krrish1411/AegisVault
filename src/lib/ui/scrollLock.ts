/**
 * Reference-counted body scroll lock manager.
 * Ensures that nested modal dialogs or sheets do not prematurely release
 * the background body scroll lock when one child dialog unmounts.
 */

let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

export function acquireScrollLock(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    previousPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width to prevent layout shift (CLS)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
  }

  lockCount++;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    }
  };
}
