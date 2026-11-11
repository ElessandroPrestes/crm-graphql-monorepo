import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWhatsAppSignature, verifyWhatsAppToken } from './whatsapp-signature.js';

const SECRET = 'test-only-whatsapp-app-secret';

function sign(payload: string, secret = SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

describe('verifyWhatsAppSignature', () => {
  it('accepts a valid sha256 signature', () => {
    const body = Buffer.from(JSON.stringify({ hello: 'world' }), 'utf8');

    expect(verifyWhatsAppSignature(body, sign(body.toString('utf8')), SECRET)).toBe(true);
  });

  it('rejects missing, malformed and mismatched signatures', () => {
    const body = Buffer.from('{}', 'utf8');

    expect(verifyWhatsAppSignature(body, undefined, SECRET)).toBe(false);
    expect(verifyWhatsAppSignature(body, 'sha1=abc', SECRET)).toBe(false);
    expect(verifyWhatsAppSignature(body, 'sha256=zzzz', SECRET)).toBe(false);
    expect(verifyWhatsAppSignature(body, sign('{}', 'another-secret-with-16-chars'), SECRET)).toBe(
      false,
    );
  });
});

describe('verifyWhatsAppToken', () => {
  it('compares tokens in constant time', () => {
    expect(verifyWhatsAppToken('verify-me', 'verify-me')).toBe(true);
    expect(verifyWhatsAppToken('verify-me', 'verify-you')).toBe(false);
    expect(verifyWhatsAppToken(undefined, 'verify-me')).toBe(false);
  });
});
