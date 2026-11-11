import { describe, expect, it } from 'vitest';
import { normalizePhone, whatsappInboundEventSchema } from './whatsapp.js';

describe('normalizePhone', () => {
  it('keeps only digits', () => {
    expect(normalizePhone('+55 (11) 99999-8888')).toBe('5511999998888');
  });
});

describe('whatsappInboundEventSchema', () => {
  it('validates a complete inbound event', () => {
    const event = whatsappInboundEventSchema.parse({
      accountPhoneNumberId: 'seed-phone-seller-1',
      externalId: 'wamid.1',
      from: '5511999998888',
      profileName: 'Maria',
      text: 'Olá',
      timestamp: '2026-11-10T12:00:00.000Z',
    });

    expect(event.externalId).toBe('wamid.1');
  });

  it('rejects an event without text', () => {
    expect(() =>
      whatsappInboundEventSchema.parse({
        accountPhoneNumberId: 'seed-phone-seller-1',
        externalId: 'wamid.1',
        from: '5511999998888',
        timestamp: '2026-11-10T12:00:00.000Z',
      }),
    ).toThrow();
  });
});
