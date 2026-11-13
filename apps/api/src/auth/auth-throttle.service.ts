import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../config/env.js';
import { RateLimitService } from '../common/rate-limit/rate-limit.service.js';
import { LoginThrottledException } from '../common/rate-limit/login-throttled.exception.js';
import { RedisService } from '../redis/redis.service.js';

function emailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

@Injectable()
export class AuthThrottleService {
  private readonly logger = new Logger(AuthThrottleService.name);
  private readonly ipMax: number;
  private readonly emailMax: number;
  private readonly windowSeconds: number;
  private readonly lockThreshold: number;
  private readonly lockSeconds: number;

  constructor(
    @Inject(ConfigService) config: ConfigService<ApiEnv, true>,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {
    this.ipMax = config.get('RATE_LIMIT_LOGIN_IP_MAX', { infer: true });
    this.emailMax = config.get('RATE_LIMIT_LOGIN_EMAIL_MAX', { infer: true });
    this.windowSeconds = config.get('RATE_LIMIT_LOGIN_WINDOW_SECONDS', { infer: true });
    this.lockThreshold = config.get('LOGIN_LOCK_THRESHOLD', { infer: true });
    this.lockSeconds = config.get('LOGIN_LOCK_SECONDS', { infer: true });
  }

  async beforeLogin(ip: string, email: string): Promise<void> {
    const key = emailKey(email);

    try {
      const lockTtl = await this.redis.ttl(`throttle:login:lock:${key}`);

      if (lockTtl > 0) {
        throw new LoginThrottledException(lockTtl);
      }

      const byIp = await this.rateLimit.consume(
        `throttle:login:ip:${ip}`,
        this.ipMax,
        this.windowSeconds,
      );

      if (!byIp.allowed) {
        throw new LoginThrottledException(byIp.retryAfterSeconds);
      }

      const byEmail = await this.rateLimit.consume(
        `throttle:login:email:${key}`,
        this.emailMax,
        this.windowSeconds,
      );

      if (!byEmail.allowed) {
        throw new LoginThrottledException(byEmail.retryAfterSeconds);
      }
    } catch (error) {
      if (error instanceof LoginThrottledException) {
        throw error;
      }

      this.logger.error('Falha ao consultar o rate limit de login');
      throw new ServiceUnavailableException('Autenticação temporariamente indisponível');
    }
  }

  async recordFailure(email: string): Promise<number> {
    const key = emailKey(email);

    try {
      const failures = await this.redis.incrementWithTtl(
        `throttle:login:fail:${key}`,
        this.lockSeconds,
      );

      if (failures >= this.lockThreshold) {
        await this.redis.set(`throttle:login:lock:${key}`, '1', this.lockSeconds);
        return this.lockSeconds;
      }

      return 0;
    } catch {
      this.logger.error('Falha ao registrar tentativa de login');
      return 0;
    }
  }

  async reset(email: string): Promise<void> {
    const key = emailKey(email);

    try {
      await Promise.all([
        this.redis.delete(`throttle:login:fail:${key}`),
        this.redis.delete(`throttle:login:lock:${key}`),
      ]);
    } catch {
      this.logger.warn('Falha ao limpar contadores de login');
    }
  }
}
