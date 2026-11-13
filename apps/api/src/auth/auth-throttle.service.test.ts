import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { ApiEnv } from '../config/env.js';
import { RateLimitService } from '../common/rate-limit/rate-limit.service.js';
import type { RedisService } from '../redis/redis.service.js';
import { AuthThrottleService } from './auth-throttle.service.js';

function config(): ConfigService<ApiEnv, true> {
  const values: Record<string, number> = {
    RATE_LIMIT_LOGIN_IP_MAX: 30,
    RATE_LIMIT_LOGIN_EMAIL_MAX: 10,
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: 900,
    LOGIN_LOCK_THRESHOLD: 5,
    LOGIN_LOCK_SECONDS: 900,
  };

  return { get: (key: string) => values[key] } as unknown as ConfigService<ApiEnv, true>;
}

function redisMock(): RedisService {
  return {
    ttl: vi.fn().mockResolvedValue(-2),
    incrementWithTtl: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as RedisService;
}

describe('AuthThrottleService', () => {
  it('bloqueia a conta quando o contador atinge o limiar', async () => {
    const redis = redisMock();
    vi.mocked(redis.incrementWithTtl).mockResolvedValue(5);
    const service = new AuthThrottleService(config(), new RateLimitService(redis), redis);

    await expect(service.recordFailure('admin@nexo.local')).resolves.toBe(900);
    expect(redis.set).toHaveBeenCalledOnce();
  });

  it('falha fechado quando o Redis não responde no login', async () => {
    const redis = redisMock();
    vi.mocked(redis.ttl).mockRejectedValue(new Error('redis down'));
    const service = new AuthThrottleService(config(), new RateLimitService(redis), redis);

    await expect(service.beforeLogin('127.0.0.1', 'admin@nexo.local')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
