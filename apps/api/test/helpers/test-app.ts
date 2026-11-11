import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { rawBodyJsonOptions } from '../../src/common/raw-body-parser.js';

const apiRoot = fileURLToPath(new URL('../..', import.meta.url));

export interface TestContext {
  container: StartedPostgreSqlContainer;
  redis: StartedTestContainer;
  rabbitmq?: StartedTestContainer;
  app: INestApplication;
  server: Server;
  wsUrl: string;
}

export interface StartTestAppOptions {
  rabbitmq?: boolean;
}

export async function startTestApp(options: StartTestAppOptions = {}): Promise<TestContext> {
  const [container, redis, rabbitmq] = await Promise.all([
    new PostgreSqlContainer('postgres:18.6-alpine').start(),
    new GenericContainer('redis:8.8.4-alpine').withExposedPorts(6379).start(),
    options.rabbitmq
      ? new GenericContainer('rabbitmq:4.4.0-alpine')
          .withExposedPorts(5672)
          .withWaitStrategy(Wait.forListeningPorts())
          .start()
      : Promise.resolve(undefined),
  ]);
  const databaseUrl = container.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.ACCESS_TOKEN_SECRET = 'test-only-access-token-secret-32-chars';
  process.env.ACCESS_TOKEN_TTL_SECONDS = '900';
  process.env.REFRESH_TOKEN_TTL_SECONDS = '604800';
  process.env.REFRESH_COOKIE_NAME = 'nexo_refresh';
  process.env.CORS_ORIGINS = 'http://localhost:5217';
  process.env.WHATSAPP_PROVIDER = 'mock';
  process.env.WHATSAPP_APP_SECRET = 'test-only-whatsapp-app-secret';
  process.env.WHATSAPP_VERIFY_TOKEN = 'test-only-whatsapp-verify-token';

  if (rabbitmq) {
    process.env.RABBITMQ_URL = `amqp://guest:guest@${rabbitmq.getHost()}:${rabbitmq.getMappedPort(5672)}`;
  }

  const commandEnv = { ...process.env, DATABASE_URL: databaseUrl };

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: apiRoot,
    env: commandEnv,
    stdio: 'pipe',
  });
  execFileSync('pnpm', ['exec', 'tsx', 'prisma/seed.ts'], {
    cwd: apiRoot,
    env: commandEnv,
    stdio: 'pipe',
  });

  const { AppModule } = await import('../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });

  app.use(cookieParser());
  app.useBodyParser('json', rawBodyJsonOptions());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  await app.listen(0);

  const address = app.getHttpServer().address() as AddressInfo;
  const server = app.getHttpServer() as Server;

  return {
    container,
    redis,
    ...(rabbitmq ? { rabbitmq } : {}),
    app,
    server,
    wsUrl: `ws://127.0.0.1:${address.port}/graphql`,
  };
}

export async function stopTestApp(context: TestContext): Promise<void> {
  await context.app.close();
  await Promise.all([context.container.stop(), context.redis.stop(), context.rabbitmq?.stop()]);
}
