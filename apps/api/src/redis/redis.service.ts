import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { ApiEnv } from '../config/env.js';

type MessageHandler = (message: string) => void;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly cache: Redis;
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly handlers = new Map<string, MessageHandler>();
  private messageListenerAttached = false;

  constructor(@Inject(ConfigService) config: ConfigService<ApiEnv, true>) {
    const url = config.get('REDIS_URL', { infer: true });

    this.cache = this.createClient(url);
    this.publisher = this.createClient(url);
    this.subscriber = this.createClient(url);
  }

  private createClient(url: string): Redis {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 250, 2000),
    });

    client.on('error', (error: Error) => {
      this.logger.debug(`Redis indisponível: ${error.message}`);
    });

    return client;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.cache.get(key);

    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.cache.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.cache.get(key);
  }

  async increment(key: string): Promise<number> {
    return this.cache.incr(key);
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    this.handlers.set(channel, handler);

    if (!this.messageListenerAttached) {
      this.subscriber.on('message', (incomingChannel: string, message: string) => {
        this.handlers.get(incomingChannel)?.(message);
      });
      this.messageListenerAttached = true;
    }

    await this.subscriber.subscribe(channel);
  }

  async onModuleDestroy(): Promise<void> {
    this.handlers.clear();

    await Promise.allSettled([this.cache.quit(), this.publisher.quit(), this.subscriber.quit()]);
  }
}
