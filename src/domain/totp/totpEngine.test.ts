import { describe, it, expect } from 'vitest';
import {
  decodeBase32,
  generateTotp,
  parseOtpauthUri,
  formatTotpCode,
} from './totpEngine';

describe('totpEngine (RFC 6238 / RFC 4226)', () => {
  // RFC 6238 test secret: "12345678901234567890" in Base32
  const RFC_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  it('should decode Base32 strings with uppercase, lowercase, spaces, and padding', () => {
    const bytes = decodeBase32('JBSWY3DPEHPK3PXP');
    expect(bytes).toBeDefined();
    expect(bytes.length).toBe(10);

    // With spaces and lowercase
    const bytes2 = decodeBase32('jbsw y3dp ehpk 3pxp===');
    expect(bytes2).toEqual(bytes);
  });

  it('should generate deterministic TOTP codes matching RFC 6238 test vectors', async () => {
    // RFC 6238 vector for epoch 59 seconds (step 1)
    const result1 = await generateTotp(RFC_SECRET_BASE32, {
      timestamp: 59 * 1000,
      period: 30,
      digits: 8,
      algorithm: 'SHA1',
    });
    expect(result1.code).toBe('94287082');

    // RFC 6238 vector for epoch 1111111109 seconds (step 37037036)
    const result2 = await generateTotp(RFC_SECRET_BASE32, {
      timestamp: 1111111109 * 1000,
      period: 30,
      digits: 8,
      algorithm: 'SHA1',
    });
    expect(result2.code).toBe('07081804');
  });

  it('should calculate remaining seconds and progress accurately', async () => {
    const result = await generateTotp(RFC_SECRET_BASE32, {
      timestamp: 45 * 1000,
      period: 30,
    });
    expect(result.secondsRemaining).toBe(15);
    expect(result.progress).toBe(0.5);
  });

  it('should parse standard otpauth:// URIs with issuer, account, and secret', () => {
    const uri = 'otpauth://totp/GitHub:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&digits=6&period=30';
    const parsed = parseOtpauthUri(uri);

    expect(parsed.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(parsed.issuer).toBe('GitHub');
    expect(parsed.account).toBe('user@example.com');
    expect(parsed.digits).toBe(6);
    expect(parsed.period).toBe(30);
  });

  it('should format TOTP codes with clean spacing for readability', () => {
    expect(formatTotpCode('123456')).toBe('123 456');
    expect(formatTotpCode('12345678')).toBe('1234 5678');
  });

  it('should generate TOTP codes directly from otpauth:// URIs', async () => {
    const uri = 'otpauth://totp/Google:krish%40gmail.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8&period=30';
    const result = await generateTotp(uri, { timestamp: 59 * 1000 });
    expect(result.code).toBe('94287082');
  });
});
