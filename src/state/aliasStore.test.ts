import { describe, it, expect, beforeEach } from 'vitest';
import { useAliasStore, FORWARDING_EMAIL_STORAGE_KEY, CUSTOM_ALIASES_STORAGE_KEY } from './aliasStore';

describe('aliasStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAliasStore.setState({
      forwardingEmail: '',
      customAliases: [],
    });
  });

  it('updates forwarding email and persists to localStorage', () => {
    const { setForwardingEmail } = useAliasStore.getState();
    setForwardingEmail('alex.secure@proton.me');

    expect(useAliasStore.getState().forwardingEmail).toBe('alex.secure@proton.me');
    expect(localStorage.getItem(FORWARDING_EMAIL_STORAGE_KEY)).toBe('alex.secure@proton.me');
  });

  it('adds custom standalone aliases with tag and timestamp', () => {
    const { addCustomAlias } = useAliasStore.getState();
    const created = addCustomAlias('newsletter-xyz9@duck.com', 'Substack', 'For tech blogs');

    expect(created.alias).toBe('newsletter-xyz9@duck.com');
    expect(created.tag).toBe('Substack');
    expect(created.notes).toBe('For tech blogs');
    expect(useAliasStore.getState().customAliases.length).toBe(1);
    expect(JSON.parse(localStorage.getItem(CUSTOM_ALIASES_STORAGE_KEY) || '[]')).toHaveLength(1);
  });

  it('removes custom standalone aliases', () => {
    const { addCustomAlias, removeCustomAlias } = useAliasStore.getState();
    const item = addCustomAlias('burner-123@duck.com', 'Temporary');
    expect(useAliasStore.getState().customAliases.length).toBe(1);

    removeCustomAlias(item.id);
    expect(useAliasStore.getState().customAliases.length).toBe(0);
  });
});
