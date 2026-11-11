import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { Deal } from '../generated/prisma/client.js';
import { RedisService } from '../redis/redis.service.js';

export const DEAL_MOVED_CHANNEL = 'deals.moved';

export interface DealMovedPayload {
  dealMoved: Deal;
}

function reviveDeal(deal: Deal): Deal {
  return {
    ...deal,
    expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
    closedAt: deal.closedAt ? new Date(deal.closedAt) : null,
    createdAt: new Date(deal.createdAt),
    updatedAt: new Date(deal.updatedAt),
  };
}

@Injectable()
export class DealEventsService implements OnModuleInit {
  private readonly logger = new Logger(DealEventsService.name);
  private readonly listeners = new Set<(payload: DealMovedPayload) => void>();

  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.subscribe(DEAL_MOVED_CHANNEL, (message) => {
        try {
          const payload = JSON.parse(message) as DealMovedPayload;

          this.emit({ dealMoved: reviveDeal(payload.dealMoved) });
        } catch {
          this.logger.warn('Evento dealMoved inválido recebido do Redis');
        }
      });
    } catch {
      this.logger.warn(
        'Não foi possível assinar o canal dealMoved; tempo real ficará indisponível',
      );
    }
  }

  async publishDealMoved(deal: Deal): Promise<void> {
    try {
      await this.redis.publish(DEAL_MOVED_CHANNEL, { dealMoved: deal });
    } catch {
      this.logger.warn('Falha ao publicar dealMoved; evento descartado');
    }
  }

  createIterator(): AsyncIterableIterator<DealMovedPayload> {
    const queue: DealMovedPayload[] = [];
    let resolveNext: ((result: IteratorResult<DealMovedPayload>) => void) | undefined;

    const deliver = (payload: DealMovedPayload): void => {
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

  private emit(payload: DealMovedPayload): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}
