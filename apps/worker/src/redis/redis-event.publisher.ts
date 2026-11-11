import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { WorkerEnv } from '../config/env.js';

@Injectable()
export class RedisEventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RedisEventPublisher.name);
  private readonly client: Redis;

  constructor(@Inject(ConfigService) config: ConfigService<WorkerEnv, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 250, 2000),
    });

    this.client.on('error', (error: Error) => {
      this.logger.debug(`Redis indisponível: ${error.message}`);
    });
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    try {
      await this.client.publish(channel, JSON.stringify(payload));
    } catch (error) {
      this.logger.warn(
        `Falha ao publicar evento ${channel}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
