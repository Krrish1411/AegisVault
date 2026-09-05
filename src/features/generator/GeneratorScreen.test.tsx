import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratorScreen } from './GeneratorScreen';

describe('GeneratorScreen UI', () => {
  it('should render Generator title and default password tab', () => {
    render(<GeneratorScreen />);

    expect(screen.getByText('Secret Generator')).toBeInTheDocument();
    expect(screen.getByText('Copy Secret')).toBeInTheDocument();
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
    expect(screen.getByText('Uppercase Letters')).toBeInTheDocument();
  });

  it('should switch to Passphrase tab and display word count slider', () => {
    render(<GeneratorScreen />);

    const passphraseTab = screen.getByRole('button', { name: /passphrase/i });
    fireEvent.click(passphraseTab);

    expect(screen.getByText(/word count/i)).toBeInTheDocument();
    expect(screen.getByText('Word Separator')).toBeInTheDocument();
  });

  it('should switch to PIN tab and display numeric length controls', () => {
    render(<GeneratorScreen />);

    const pinTab = screen.getByRole('button', { name: /pin/i });
    fireEvent.click(pinTab);

    expect(screen.getByText(/pin length/i)).toBeInTheDocument();
    expect(screen.getByText('4-Digit PIN')).toBeInTheDocument();
  });
});
