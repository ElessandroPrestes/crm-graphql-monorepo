import { z } from 'zod';

export const WHATSAPP_EXCHANGE = 'nexo.events';
export const WHATSAPP_INBOUND_QUEUE = 'whatsapp.inbound';
export const WHATSAPP_INBOUND_ROUTING_KEY = 'whatsapp.inbound';
export const WHATSAPP_DLX = 'nexo.dlx';
export const WHATSAPP_DLQ = 'whatsapp.inbound.dlq';
export const WHATSAPP_RETRY_HEADER = 'x-retry-count';
export const MESSAGE_RECEIVED_CHANNEL = 'messages.received';

export const WHATSAPP_RETRY_QUEUES = [
  { name: 'whatsapp.inbound.retry.5s', ttlMs: 5_000 },
  { name: 'whatsapp.inbound.retry.30s', ttlMs: 30_000 },
  { name: 'whatsapp.inbound.retry.5m', ttlMs: 300_000 },
] as const;

export const WHATSAPP_MAX_RETRIES = WHATSAPP_RETRY_QUEUES.length;

export const whatsappInboundEventSchema = z.object({
  accountPhoneNumberId: z.string().min(1),
  externalId: z.string().min(1).max(255),
  from: z.string().min(5).max(32),
  profileName: z.string().min(1).max(120).optional(),
  text: z.string().min(1).max(65_535),
  timestamp: z.string().datetime(),
});

export type WhatsAppInboundEvent = z.infer<typeof whatsappInboundEventSchema>;

export const messageReceivedEventSchema = z.object({
  messageReceived: z.object({
    messageId: z.string().uuid(),
    conversationId: z.string().uuid(),
    ownerId: z.string().uuid(),
    occurredAt: z.string().datetime(),
  }),
});

export type MessageReceivedEvent = z.infer<typeof messageReceivedEventSchema>;

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}
