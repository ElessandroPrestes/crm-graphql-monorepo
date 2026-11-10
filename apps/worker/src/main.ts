import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { AppModule } from './app.module.js';
import type { WorkerEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<WorkerEnv, true>);
  const port = config.get('WORKER_PORT', { infer: true });

  app.use(helmet());
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
  app.enableShutdownHooks();

  await app.listen(port);
}

void bootstrap();
