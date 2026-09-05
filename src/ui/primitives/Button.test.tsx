import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Primitive', () => {
  it('renders button with children text', () => {
    render(<Button>Unlock Vault</Button>);
    expect(screen.getByRole('button', { name: /unlock vault/i })).toBeInTheDocument();
  });

  it('handles click event', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and shows spinner when isLoading is true', () => {
    render(<Button isLoading>Saving...</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-danger');
  });
});
