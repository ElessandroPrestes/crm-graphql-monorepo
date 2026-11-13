import { describe, expect, it } from 'vitest';
import type { RedisService } from '../../redis/redis.service.js';
import { RateLimitService } from './rate-limit.service.js';

class FakeRedis {
  private readonly values = new Map<string, { value: number; ttl: number }>();

  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const current = this.values.get(key);

    if (!current) {
      this.values.set(key, { value: 1, ttl: ttlSeconds });
      return 1;
    }

    current.value += 1;
    return current.value;
  }

  async ttl(key: string): Promise<number> {
    return this.values.get(key)?.ttl ?? -2;
  }
}

describe('RateLimitService', () => {
  it('permite requisições até o limite e bloqueia o excedente com retry', async () => {
    const service = new RateLimitService(new FakeRedis() as unknown as RedisService);

    const first = await service.consume('key', 2, 60);
    const second = await service.consume('key', 2, 60);
    const third = await service.consume('key', 2, 60);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSeconds).toBe(60);
  });
});
