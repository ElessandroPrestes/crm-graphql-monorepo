import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWhatsAppSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  const separator = signatureHeader.indexOf('=');

  if (separator < 0) {
    return false;
  }

  const scheme = signatureHeader.slice(0, separator);
  const provided = signatureHeader.slice(separator + 1).toLowerCase();

  if (scheme !== 'sha256' || provided.length === 0) {
    return false;
  }

  if (!/^[0-9a-f]{64}$/.test(provided)) {
    return false;
  }

  const expected = createHmac('sha256', appSecret).update(rawBody).digest();

  return timingSafeEqual(expected, Buffer.from(provided, 'hex'));
}

export function verifyWhatsAppToken(provided: string | undefined, expected: string): boolean {
  if (!provided) {
    return false;
  }

  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
