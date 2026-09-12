import { describe, it, expect } from 'vitest';
import { generateBurnerPersona, formatAddress } from './burnerPersonaGenerator';

describe('burnerPersonaGenerator', () => {
  it('should generate a valid disposable burner persona', () => {
    const persona = generateBurnerPersona();

    expect(persona.profileType).toBe('temporary');
    expect(persona.fullName).toBeDefined();
    expect(persona.fullName?.length).toBeGreaterThan(3);
    expect(persona.addressLine1).toBeDefined();
    expect(persona.city).toBeDefined();
    expect(persona.postalCode).toBeDefined();
    expect(persona.country).toBeDefined();
    expect(persona.phone).toMatch(/^\+(1|44|91)/);
    expect(persona.email).toMatch(/^[a-z0-9.]+@/);
    expect(persona.purpose).toBeDefined();
    expect(persona.title).toContain('Burner Persona');
  });

  it('should format address lines into a multiline string', () => {
    const persona = generateBurnerPersona();
    const formatted = formatAddress(persona);

    expect(formatted).toContain(persona.fullName);
    expect(formatted).toContain(persona.addressLine1);
    expect(formatted).toContain(persona.city);
    expect(formatted).toContain(persona.postalCode);
    expect(formatted).toContain(persona.phone);
    expect(formatted).toContain(persona.email);
  });
});
