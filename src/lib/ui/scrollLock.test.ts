import { describe, it, expect, beforeEach } from 'vitest';
import { acquireScrollLock } from './scrollLock';

describe('scrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('should lock body scroll when acquired', () => {
    const release = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('');
  });

  it('should maintain scroll lock until all references are released', () => {
    const release1 = acquireScrollLock();
    const release2 = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    release1();
    // Still locked because release2 is active
    expect(document.body.style.overflow).toBe('hidden');

    release2();
    // Now unlocked
    expect(document.body.style.overflow).toBe('');
  });

  it('should handle idempotent double releases safely', () => {
    const release = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');

    release();
    release(); // Should not underflow
    expect(document.body.style.overflow).toBe('');
  });
});
