import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type ChannelModel, type ConfirmChannel } from 'amqplib';
import {
  WHATSAPP_DLQ,
  WHATSAPP_DLX,
  WHATSAPP_EXCHANGE,
  WHATSAPP_INBOUND_QUEUE,
  WHATSAPP_INBOUND_ROUTING_KEY,
} from '@nexo/shared';
import type { ApiEnv } from '../config/env.js';

@Injectable()
export class RabbitMqService {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private connecting?: Promise<ConfirmChannel>;

  constructor(@Inject(ConfigService) private readonly config: ConfigService<ApiEnv, true>) {}

  async publish(routingKey: string, payload: unknown, messageId: string): Promise<void> {
    try {
      const channel = await this.getChannel();
      const content = Buffer.from(JSON.stringify(payload), 'utf8');

      await new Promise<void>((resolve, reject) => {
        channel.publish(
          WHATSAPP_EXCHANGE,
          routingKey,
          content,
          {
            persistent: true,
            contentType: 'application/json',
            messageId,
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          },
        );
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao publicar evento ${routingKey}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
      await this.reset();
      throw new ServiceUnavailableException('Mensageria indisponível');
    }
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    this.connecting ??= this.createChannel();

    try {
      return await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async createChannel(): Promise<ConfirmChannel> {
    const url = this.config.get('RABBITMQ_URL', { infer: true });
    const connection = await connect(url);
    const channel = await connection.createConfirmChannel();

    await channel.assertExchange(WHATSAPP_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(WHATSAPP_DLX, 'direct', { durable: true });
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

    connection.on('close', () => {
      this.logger.warn('Conexão com o RabbitMQ encerrada');
      this.channel = undefined;
      this.connection = undefined;
    });
    connection.on('error', (error: Error) => {
      this.logger.warn(`Erro na conexão com o RabbitMQ: ${error.message}`);
    });

    this.connection = connection;
    this.channel = channel;

    return channel;
  }

  private async reset(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;

    this.channel = undefined;
    this.connection = undefined;

    await channel?.close().catch(() => undefined);
    await connection?.close().catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.reset();
  }
}
