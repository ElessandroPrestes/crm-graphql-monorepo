import 'reflect-metadata';
import './auth/authenticated-request.js';
import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { AppModule } from './app.module.js';
import { rawBodyJsonOptions } from './common/raw-body-parser.js';
import type { ApiEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService<ApiEnv, true>);
  const port = config.get('API_PORT', { infer: true });
  const origins = config.get('CORS_ORIGINS', { infer: true });

  app.use(helmet());
  app.useBodyParser('json', rawBodyJsonOptions());
  app.use(cookieParser());
  app.use(
    pinoHttp({
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[redacted]',
      },
      genReqId: (request, response) => {
        const header = request.headers['x-request-id'];
        const requestId = typeof header === 'string' && header.length > 0 ? header : randomUUID();

        response.setHeader('x-request-id', requestId);
        return requestId;
      },
    }),
  );
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
    exposedHeaders: ['Retry-After', 'X-Request-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(port);
}

void bootstrap();
