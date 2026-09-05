import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

describe('EmptyState Primitive', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No passwords stored"
        description="Add your first encrypted password"
        primaryAction={<Button>Add Password</Button>}
      />
    );

    expect(screen.getByText('No passwords stored')).toBeInTheDocument();
    expect(screen.getByText('Add your first encrypted password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add password/i })).toBeInTheDocument();
  });
});
