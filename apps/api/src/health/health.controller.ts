import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../config/env.js';

export interface HealthResponse {
  status: 'ok';
  service: 'api';
  environment: ApiEnv['NODE_ENV'];
  timestamp: string;
  uptime?: number;
}

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  @Get('live')
  live(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      environment: this.configService.get('NODE_ENV', { infer: true }),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      environment: this.configService.get('NODE_ENV', { infer: true }),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
