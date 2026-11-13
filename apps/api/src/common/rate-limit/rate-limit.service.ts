import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimitService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const count = await this.redis.incrementWithTtl(key, windowSeconds);
    const ttl = await this.redis.ttl(key);
    const retryAfterSeconds = Math.max(ttl, 1);

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      retryAfterSeconds: count <= limit ? 0 : retryAfterSeconds,
    };
  }
}
