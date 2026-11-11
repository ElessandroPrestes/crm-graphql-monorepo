import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateWorkerEnv } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { WhatsAppModule } from './whatsapp/whatsapp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateWorkerEnv,
    }),
    HealthModule,
    WhatsAppModule,
  ],
})
export class AppModule {}
