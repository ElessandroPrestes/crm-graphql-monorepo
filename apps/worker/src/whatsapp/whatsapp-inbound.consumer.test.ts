import { describe, expect, it, vi } from 'vitest';
import type { Channel, ConsumeMessage } from 'amqplib';
import { WHATSAPP_DLQ, WHATSAPP_RETRY_HEADER, WHATSAPP_RETRY_QUEUES } from '@nexo/shared';
import type { ConfigService } from '@nestjs/config';
import type { WorkerEnv } from '../config/env.js';
import {
  UnprocessableEventError,
  type WhatsAppInboundProcessor,
} from './whatsapp-inbound.processor.js';
import { WhatsAppInboundConsumer } from './whatsapp-inbound.consumer.js';

const event = {
  accountPhoneNumberId: 'seed-phone-seller-1',
  externalId: 'wamid.retry.1',
  from: '5511999998888',
  text: 'Olá',
  timestamp: '2026-11-10T12:00:00.000Z',
};

function message(attempts = 0): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(event)),
    properties: {
      headers: attempts > 0 ? { [WHATSAPP_RETRY_HEADER]: attempts } : {},
      contentType: 'application/json',
      messageId: 'wamid.retry.1',
    },
    fields: {},
  } as unknown as ConsumeMessage;
}

function channel() {
  return {
    ack: vi.fn(),
    nack: vi.fn(),
    sendToQueue: vi.fn(() => true),
  } as unknown as Channel & {
    ack: ReturnType<typeof vi.fn>;
    nack: ReturnType<typeof vi.fn>;
    sendToQueue: ReturnType<typeof vi.fn>;
  };
}

function consumer(process: WhatsAppInboundProcessor['process']) {
  const config = {
    get: vi.fn(() => 10),
  } as unknown as ConfigService<WorkerEnv, true>;
  const instance = new WhatsAppInboundConsumer(config, { process } as WhatsAppInboundProcessor);

  return {
    instance,
    handle: (msg: ConsumeMessage, ch: Channel) =>
      (
        instance as unknown as {
          handle(message: ConsumeMessage, channel: Channel): Promise<void>;
        }
      ).handle(msg, ch),
  };
}

describe('WhatsAppInboundConsumer', () => {
  it('acks and publishes to the first retry queue on a transient failure', async () => {
    const ch = channel();
    const { handle } = consumer(vi.fn().mockRejectedValue(new Error('database unavailable')));

    await handle(message(), ch);

    expect(ch.sendToQueue).toHaveBeenCalledWith(
      WHATSAPP_RETRY_QUEUES[0].name,
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({ [WHATSAPP_RETRY_HEADER]: 1 }),
      }),
    );
    expect(ch.ack).toHaveBeenCalledOnce();
  });

  it('moves to the DLQ after the last retry', async () => {
    const ch = channel();
    const { handle } = consumer(vi.fn().mockRejectedValue(new Error('still failing')));

    await handle(message(WHATSAPP_RETRY_QUEUES.length), ch);

    expect(ch.sendToQueue).toHaveBeenCalledWith(
      WHATSAPP_DLQ,
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-error': 'max-retries-exceeded' }),
      }),
    );
    expect(ch.ack).toHaveBeenCalledOnce();
  });

  it('sends unprocessable events straight to the DLQ', async () => {
    const ch = channel();
    const { handle } = consumer(vi.fn().mockRejectedValue(new UnprocessableEventError('conta')));

    await handle(message(), ch);

    expect(ch.sendToQueue).toHaveBeenCalledWith(
      WHATSAPP_DLQ,
      expect.any(Buffer),
      expect.objectContaining({ headers: expect.objectContaining({ 'x-error': 'conta' }) }),
    );
    expect(ch.ack).toHaveBeenCalledOnce();
  });

  it('acknowledges duplicate events without republishing', async () => {
    const ch = channel();
    const { handle } = consumer(
      vi.fn().mockResolvedValue({ messageId: 'm', conversationId: 'c', duplicate: true }),
    );

    await handle(message(), ch);

    expect(ch.sendToQueue).not.toHaveBeenCalled();
    expect(ch.ack).toHaveBeenCalledOnce();
  });

  it('closes channel before connection on shutdown', async () => {
    const order: string[] = [];
    const config = { get: vi.fn(() => 10) } as unknown as ConfigService<WorkerEnv, true>;
    const instance = new WhatsAppInboundConsumer(config, {} as WhatsAppInboundProcessor);
    const internals = instance as unknown as {
      channel: { close(): Promise<void> };
      connection: { close(): Promise<void> };
      onModuleDestroy(): Promise<void>;
    };

    internals.channel = {
      close: vi.fn(async () => {
        order.push('channel');
      }),
    };
    internals.connection = {
      close: vi.fn(async () => {
        order.push('connection');
      }),
    };

    await internals.onModuleDestroy();

    expect(order).toEqual(['channel', 'connection']);
  });

  it('sends invalid payloads to the DLQ', async () => {
    const ch = channel();
    const { handle } = consumer(vi.fn());
    const invalid = {
      content: Buffer.from('{'),
      properties: {},
      fields: {},
    } as unknown as ConsumeMessage;

    await handle(invalid, ch);

    expect(ch.sendToQueue).toHaveBeenCalledWith(
      WHATSAPP_DLQ,
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-error': 'invalid-payload' }),
      }),
    );
  });
});
