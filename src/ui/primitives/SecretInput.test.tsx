import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecretInput } from './SecretInput';
import { webClipboard } from '@/platform/web/WebClipboardPort';

describe('SecretInput Primitive', () => {
  it('renders masked password by default', () => {
    render(<SecretInput placeholder="Password" value="super-secret" readOnly />);
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('toggles visibility when reveal button is clicked', async () => {
    render(<SecretInput placeholder="Password" value="super-secret" readOnly />);
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement;
    const revealBtn = screen.getByRole('button', { name: /reveal secret/i });

    expect(input.type).toBe('password');
    await userEvent.click(revealBtn);
    expect(input.type).toBe('text');

    const hideBtn = screen.getByRole('button', { name: /hide secret/i });
    await userEvent.click(hideBtn);
    expect(input.type).toBe('password');
  });

  it('copies secret to clipboard when copy button is clicked', async () => {
    const clipboardSpy = vi.spyOn(webClipboard, 'writeText').mockResolvedValue();
    render(<SecretInput placeholder="Password" value="copy-this-secret" readOnly allowCopy />);

    const copyBtn = screen.getByRole('button', { name: /copy secret/i });
    await userEvent.click(copyBtn);

    expect(clipboardSpy).toHaveBeenCalledWith('copy-this-secret', { autoClearMs: 30000 });
  });
});
