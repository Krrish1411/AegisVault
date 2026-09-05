import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from './StatusIndicator';

describe('StatusIndicator Primitive', () => {
  it('renders default label for offline status', () => {
    render(<StatusIndicator status="offline" />);
    expect(screen.getByText('Offline / Private')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<StatusIndicator status="healthy" label="Vault Healthy" />);
    expect(screen.getByText('Vault Healthy')).toBeInTheDocument();
  });
});
