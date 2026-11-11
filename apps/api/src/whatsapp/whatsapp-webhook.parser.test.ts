import { describe, expect, it } from 'vitest';
import { parseWhatsAppWebhook } from './whatsapp-webhook.parser.js';

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'entry-1',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5511800000001',
              phone_number_id: 'seed-phone-seller-1',
            },
            contacts: [{ wa_id: '5511999998888', profile: { name: 'Maria Silva' } }],
            messages: [
              {
                id: 'wamid.1',
                from: '5511999998888',
                timestamp: '1762783200',
                type: 'text',
                text: { body: '  Olá, tudo bem?  ' },
              },
              {
                id: 'wamid.2',
                from: '5511999998888',
                timestamp: '1762783201',
                type: 'image',
                image: { id: 'media-1' },
              },
              {
                id: 'wamid.1',
                from: '5511999998888',
                timestamp: '1762783200',
                type: 'text',
                text: { body: 'Duplicada' },
              },
            ],
          },
        },
      ],
    },
  ],
};

describe('parseWhatsAppWebhook', () => {
  it('extracts, normalizes and deduplicates text messages', () => {
    const events = parseWhatsAppWebhook(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      accountPhoneNumberId: 'seed-phone-seller-1',
      externalId: 'wamid.1',
      from: '5511999998888',
      profileName: 'Maria Silva',
      text: 'Olá, tudo bem?',
    });
    expect(events[0]?.timestamp).toBe(new Date(1762783200 * 1000).toISOString());
  });

  it('ignores payloads that are not WhatsApp business accounts', () => {
    expect(parseWhatsAppWebhook({ object: 'other', entry: [] })).toEqual([]);
  });

  it('rejects malformed payloads', () => {
    expect(() => parseWhatsAppWebhook({ object: 'whatsapp_business_account' })).toThrow();
  });
});
