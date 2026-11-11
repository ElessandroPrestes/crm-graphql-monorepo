import { z } from 'zod';
import type { WhatsAppInboundEvent } from '@nexo/shared';

const contactSchema = z
  .object({
    wa_id: z.string().min(1),
    profile: z.object({ name: z.string().min(1).max(120) }).optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    id: z.string().min(1).max(255),
    from: z.string().min(5).max(32),
    timestamp: z.union([z.string(), z.number()]),
    type: z.string().min(1),
    text: z.object({ body: z.string().max(65_535) }).optional(),
  })
  .passthrough();

const valueSchema = z
  .object({
    messaging_product: z.string().optional(),
    metadata: z.object({ phone_number_id: z.string().min(1) }).passthrough(),
    contacts: z.array(contactSchema).optional(),
    messages: z.array(messageSchema).optional(),
  })
  .passthrough();

const changeSchema = z
  .object({
    value: valueSchema,
  })
  .passthrough();

const entrySchema = z
  .object({
    changes: z.array(changeSchema).default([]),
  })
  .passthrough();

const webhookSchema = z
  .object({
    object: z.string(),
    entry: z.array(entrySchema),
  })
  .passthrough();

function toIsoTimestamp(value: string | number): string | null {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseWhatsAppWebhook(payload: unknown): WhatsAppInboundEvent[] {
  const parsed = webhookSchema.parse(payload);

  if (parsed.object !== 'whatsapp_business_account') {
    return [];
  }

  const events = new Map<string, WhatsAppInboundEvent>();

  for (const entry of parsed.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      const phoneNumberId = value.metadata.phone_number_id;
      const profileNames = new Map(
        (value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile?.name]),
      );

      for (const message of value.messages ?? []) {
        if (message.type !== 'text') {
          continue;
        }

        const text = message.text?.body?.trim();

        if (!text) {
          continue;
        }

        const timestamp = toIsoTimestamp(message.timestamp);

        if (!timestamp) {
          continue;
        }

        const profileName = profileNames.get(message.from);

        if (!events.has(message.id)) {
          events.set(message.id, {
            accountPhoneNumberId: phoneNumberId,
            externalId: message.id,
            from: message.from,
            ...(profileName ? { profileName } : {}),
            text,
            timestamp,
          });
        }
      }
    }
  }

  return [...events.values()];
}
