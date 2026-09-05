import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Primitive', () => {
  it('renders input with placeholder and value', async () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Vault name" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Vault name');
    expect(input).toBeInTheDocument();

    await userEvent.type(input, 'My Test Vault');
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message when error prop is provided', () => {
    render(<Input placeholder="Email" error="Invalid email address" />);
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });
});
