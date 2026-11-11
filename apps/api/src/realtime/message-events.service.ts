import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { MESSAGE_RECEIVED_CHANNEL, type MessageReceivedEvent } from '@nexo/shared';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class MessageEventsService implements OnModuleInit {
  private readonly logger = new Logger(MessageEventsService.name);
  private readonly listeners = new Set<(payload: MessageReceivedEvent) => void>();

  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.subscribe(MESSAGE_RECEIVED_CHANNEL, (message) => {
        try {
          const payload = JSON.parse(message) as MessageReceivedEvent;

          if (payload.messageReceived?.messageId) {
            this.emit(payload);
          }
        } catch {
          this.logger.warn('Evento messageReceived inválido recebido do Redis');
        }
      });
    } catch {
      this.logger.warn(
        'Não foi possível assinar o canal messageReceived; tempo real ficará indisponível',
      );
    }
  }

  createIterator(): AsyncIterableIterator<MessageReceivedEvent> {
    const queue: MessageReceivedEvent[] = [];
    let resolveNext: ((result: IteratorResult<MessageReceivedEvent>) => void) | undefined;

    const deliver = (payload: MessageReceivedEvent): void => {
      if (resolveNext) {
        const resolve = resolveNext;

        resolveNext = undefined;
        resolve({ value: payload, done: false });
        return;
      }

      queue.push(payload);
    };

    this.listeners.add(deliver);

    return {
      next: () => {
        const queued = queue.shift();

        if (queued) {
          return Promise.resolve({ value: queued, done: false });
        }

        return new Promise((resolve) => {
          resolveNext = resolve;
        });
      },
      return: () => {
        this.listeners.delete(deliver);
        resolveNext = undefined;

        return Promise.resolve({ value: undefined, done: true });
      },
      throw: (error: unknown) => {
        this.listeners.delete(deliver);
        resolveNext = undefined;

        return Promise.reject(error);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  private emit(payload: MessageReceivedEvent): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}
