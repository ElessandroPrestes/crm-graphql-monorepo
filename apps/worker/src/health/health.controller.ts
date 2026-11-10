import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WorkerEnv } from '../config/env.js';

export interface HealthResponse {
  status: 'ok';
  service: 'worker';
  environment: WorkerEnv['NODE_ENV'];
  timestamp: string;
  uptime?: number;
}

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService<WorkerEnv, true>) {}

  @Get('live')
  live(): HealthResponse {
    return {
      status: 'ok',
      service: 'worker',
      environment: this.configService.get('NODE_ENV', { infer: true }),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready(): HealthResponse {
    return {
      status: 'ok',
      service: 'worker',
      environment: this.configService.get('NODE_ENV', { infer: true }),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
