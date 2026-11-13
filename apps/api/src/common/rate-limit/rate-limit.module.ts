import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module.js';
import { AuthThrottleService } from '../../auth/auth-throttle.service.js';
import { RateLimitService } from './rate-limit.service.js';

@Global()
@Module({
  imports: [RedisModule],
  providers: [RateLimitService, AuthThrottleService],
  exports: [RateLimitService, AuthThrottleService],
})
export class RateLimitModule {}
