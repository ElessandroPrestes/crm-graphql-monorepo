import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import {
  WHATSAPP_DLQ,
  WHATSAPP_DLX,
  WHATSAPP_EXCHANGE,
  WHATSAPP_INBOUND_QUEUE,
  WHATSAPP_INBOUND_ROUTING_KEY,
  WHATSAPP_MAX_RETRIES,
  WHATSAPP_RETRY_HEADER,
  WHATSAPP_RETRY_QUEUES,
  whatsappInboundEventSchema,
  type WhatsAppInboundEvent,
} from '@nexo/shared';
import type { WorkerEnv } from '../config/env.js';
import { UnprocessableEventError, WhatsAppInboundProcessor } from './whatsapp-inbound.processor.js';

const RECONNECT_DELAY_MS = 5_000;

@Injectable()
export class WhatsAppInboundConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppInboundConsumer.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private reconnectTimer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<WorkerEnv, true>,
    @Inject(WhatsAppInboundProcessor) private readonly processor: WhatsAppInboundProcessor,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    const channel = this.channel;
    const connection = this.connection;

    this.channel = undefined;
    this.connection = undefined;

    await channel?.close().catch(() => undefined);
    await connection?.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.stopped) {
      return;
    }

    try {
      const url = this.config.get('RABBITMQ_URL', { infer: true });
      const connection = await connect(url);

      connection.on('close', () => this.handleDisconnect());
      connection.on('error', (error: Error) => {
        this.logger.warn(`Erro na conexão com o RabbitMQ: ${error.message}`);
      });

      const channel = await connection.createChannel();

      await this.assertTopology(channel);
      await channel.prefetch(this.config.get('WORKER_PREFETCH', { infer: true }));
      await channel.consume(
        WHATSAPP_INBOUND_QUEUE,
        (message) => {
          if (message) {
            void this.handle(message, channel);
          }
        },
        { noAck: false },
      );

      this.connection = connection;
      this.channel = channel;
      this.logger.log(`Consumindo fila ${WHATSAPP_INBOUND_QUEUE}`);
    } catch (error) {
      this.logger.warn(
        `Falha ao conectar no RabbitMQ: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
      this.scheduleReconnect();
    }
  }

  private async assertTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(WHATSAPP_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(WHATSAPP_DLX, 'direct', { durable: true });
    await channel.assertQueue(WHATSAPP_DLQ, { durable: true });
    await channel.bindQueue(WHATSAPP_DLQ, WHATSAPP_DLX, WHATSAPP_DLQ);
    await channel.assertQueue(WHATSAPP_INBOUND_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': WHATSAPP_DLX,
        'x-dead-letter-routing-key': WHATSAPP_DLQ,
      },
    });
    await channel.bindQueue(
      WHATSAPP_INBOUND_QUEUE,
      WHATSAPP_EXCHANGE,
      WHATSAPP_INBOUND_ROUTING_KEY,
    );

    for (const retry of WHATSAPP_RETRY_QUEUES) {
      await channel.assertQueue(retry.name, {
        durable: true,
        arguments: {
          'x-message-ttl': retry.ttlMs,
          'x-dead-letter-exchange': WHATSAPP_EXCHANGE,
          'x-dead-letter-routing-key': WHATSAPP_INBOUND_ROUTING_KEY,
        },
      });
    }
  }

  private async handle(message: ConsumeMessage, channel: Channel): Promise<void> {
    const event = this.parse(message);

    if (!event) {
      this.deadLetter(channel, message, 'invalid-payload');

      return;
    }

    const attempts = retryCountOf(message);

    try {
      const result = await this.processor.process(event);

      if (result.duplicate) {
        this.logger.debug(`Evento duplicado ignorado: ${event.externalId}`);
      }

      this.ack(channel, message);
    } catch (error) {
      if (error instanceof UnprocessableEventError) {
        this.logger.warn(`Evento descartado: ${event.externalId} (${error.message})`);
        this.deadLetter(channel, message, error.message);

        return;
      }

      this.logger.warn(
        `Falha ao processar ${event.externalId} (tentativa ${attempts + 1}): ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );

      if (attempts >= WHATSAPP_MAX_RETRIES) {
        this.deadLetter(channel, message, 'max-retries-exceeded');

        return;
      }

      const retry = WHATSAPP_RETRY_QUEUES[attempts];

      if (!retry) {
        this.deadLetter(channel, message, 'max-retries-exceeded');

        return;
      }

      try {
        channel.sendToQueue(retry.name, message.content, {
          persistent: true,
          contentType: message.properties.contentType,
          messageId: message.properties.messageId,
          headers: {
            ...message.properties.headers,
            [WHATSAPP_RETRY_HEADER]: attempts + 1,
          },
        });
        this.ack(channel, message);
      } catch {
        this.nack(channel, message);
      }
    }
  }

  private parse(message: ConsumeMessage): WhatsAppInboundEvent | null {
    try {
      return whatsappInboundEventSchema.parse(JSON.parse(message.content.toString('utf8')));
    } catch {
      return null;
    }
  }

  private deadLetter(channel: Channel, message: ConsumeMessage, reason: string): void {
    try {
      channel.sendToQueue(WHATSAPP_DLQ, message.content, {
        persistent: true,
        contentType: message.properties.contentType,
        messageId: message.properties.messageId,
        headers: {
          ...message.properties.headers,
          'x-error': reason,
          'x-original-queue': WHATSAPP_INBOUND_QUEUE,
        },
      });
      this.ack(channel, message);
    } catch {
      this.nack(channel, message);
    }
  }

  private ack(channel: Channel, message: ConsumeMessage): void {
    try {
      channel.ack(message);
    } catch {
      // Canal fechado: o broker reentrega a mensagem sem ack.
    }
  }

  private nack(channel: Channel, message: ConsumeMessage): void {
    try {
      channel.nack(message, false, true);
    } catch {
      // Canal fechado: o broker reentrega a mensagem sem ack.
    }
  }

  private handleDisconnect(): void {
    this.channel = undefined;
    this.connection = undefined;

    if (!this.stopped) {
      this.logger.warn('Conexão com o RabbitMQ encerrada; tentando reconectar');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, RECONNECT_DELAY_MS);
    this.reconnectTimer.unref();
  }
}

function retryCountOf(message: ConsumeMessage): number {
  const raw = message.properties.headers?.[WHATSAPP_RETRY_HEADER];
  const value = typeof raw === 'number' ? raw : Number(raw);

  return Number.isInteger(value) && value > 0 ? value : 0;
}
