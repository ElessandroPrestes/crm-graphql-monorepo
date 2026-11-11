import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { WorkerEnv } from '../config/env.js';
import { RedisEventPublisher } from './redis-event.publisher.js';

function publisherWithUrl(url: string): RedisEventPublisher {
  const config = {
    get: (key: string) => (key === 'REDIS_URL' ? url : undefined),
  } as unknown as ConfigService<WorkerEnv, true>;

  return new RedisEventPublisher(config);
}

describe('RedisEventPublisher', () => {
  it('does not throw when Redis is unavailable', async () => {
    const publisher = publisherWithUrl('redis://127.0.0.1:1');

    await expect(
      publisher.publish('messages.received', { event: 'test' }),
    ).resolves.toBeUndefined();
    await publisher.onModuleDestroy();
  });
});
