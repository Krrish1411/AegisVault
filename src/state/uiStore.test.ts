import { describe, it, expect } from 'vitest';
import { useUiStore } from './uiStore';

describe('useUiStore', () => {
  it('should update theme', () => {
    useUiStore.getState().setTheme('light');
    expect(useUiStore.getState().theme).toBe('light');

    useUiStore.getState().setTheme('dark');
    expect(useUiStore.getState().theme).toBe('dark');
  });

  it('should update appMode between simple and advanced', () => {
    useUiStore.getState().setAppMode('advanced');
    expect(useUiStore.getState().appMode).toBe('advanced');

    useUiStore.getState().setAppMode('simple');
    expect(useUiStore.getState().appMode).toBe('simple');
  });

  it('should manage toast queue', () => {
    const id = useUiStore.getState().addToast({
      title: 'Test Toast',
      description: 'Test description',
      variant: 'success',
    });

    expect(useUiStore.getState().toasts.length).toBeGreaterThanOrEqual(1);
    expect(useUiStore.getState().toasts.some((t) => t.id === id)).toBe(true);

    useUiStore.getState().removeToast(id);
    expect(useUiStore.getState().toasts.some((t) => t.id === id)).toBe(false);
  });
});
