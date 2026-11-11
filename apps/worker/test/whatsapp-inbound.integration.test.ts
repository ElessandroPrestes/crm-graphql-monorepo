import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Redis } from 'ioredis';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MESSAGE_RECEIVED_CHANNEL } from '@nexo/shared';
import type { WorkerEnv } from '../src/config/env.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { RedisEventPublisher } from '../src/redis/redis-event.publisher.js';
import {
  UnprocessableEventError,
  WhatsAppInboundProcessor,
} from '../src/whatsapp/whatsapp-inbound.processor.js';

const apiRoot = fileURLToPath(new URL('../../api', import.meta.url));

let postgres: StartedPostgreSqlContainer;
let redisContainer: StartedTestContainer;
let prisma: PrismaService;
let publisher: RedisEventPublisher;
let processor: WhatsAppInboundProcessor;
let redis: Redis;
let redisUrl: string;
let databaseUrl: string;

function configFor(env: { databaseUrl: string; redisUrl: string }) {
  return {
    get: (key: string) => {
      if (key === 'DATABASE_URL') {
        return env.databaseUrl;
      }

      if (key === 'REDIS_URL') {
        return env.redisUrl;
      }

      return undefined;
    },
  } as unknown as ConfigService<WorkerEnv, true>;
}

beforeAll(async () => {
  [postgres, redisContainer] = await Promise.all([
    new PostgreSqlContainer('postgres:18.6-alpine').start(),
    new GenericContainer('redis:8.8.4-alpine').withExposedPorts(6379).start(),
  ]);
  databaseUrl = postgres.getConnectionUri();
  redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

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

  const config = configFor({ databaseUrl, redisUrl });

  prisma = new PrismaService(config);
  publisher = new RedisEventPublisher(config);
  processor = new WhatsAppInboundProcessor(prisma, publisher);
  redis = new Redis(redisUrl);
}, 240_000);

afterAll(async () => {
  await redis?.quit().catch(() => undefined);
  await publisher?.onModuleDestroy();
  await prisma?.onModuleDestroy();
  await Promise.all([postgres?.stop(), redisContainer?.stop()]);
}, 90_000);

describe('WhatsAppInboundProcessor', () => {
  it('cria contato, conversa e mensagem e publica o evento', async () => {
    const events: string[] = [];

    redis.on('message', (channel, message) => {
      if (channel === MESSAGE_RECEIVED_CHANNEL) {
        events.push(message);
      }
    });
    await redis.subscribe(MESSAGE_RECEIVED_CHANNEL);

    const result = await processor.process({
      accountPhoneNumberId: 'seed-phone-seller-1',
      externalId: 'wamid.integration.1',
      from: '+55 11 97777-6666',
      profileName: 'Maria Silva',
      text: 'Mensagem integrada',
      timestamp: '2026-11-10T16:00:00.000Z',
    });

    expect(result.duplicate).toBe(false);

    const contact = await prisma.contact.findFirstOrThrow({
      where: { phoneNormalized: '5511977776666' },
    });

    expect(contact).toMatchObject({ firstName: 'Maria', lastName: 'Silva' });

    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { contactId_channel: { contactId: contact.id, channel: 'WHATSAPP' } },
    });

    expect(conversation.id).toBe(result.conversationId);

    const message = await prisma.message.findUniqueOrThrow({ where: { id: result.messageId } });

    expect(message).toMatchObject({
      direction: 'INBOUND',
      status: 'RECEIVED',
      body: 'Mensagem integrada',
      externalId: 'wamid.integration.1',
    });
    expect(message.sentAt.toISOString()).toBe('2026-11-10T16:00:00.000Z');

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0] ?? '{}')).toMatchObject({
      messageReceived: {
        messageId: result.messageId,
        conversationId: result.conversationId,
        ownerId: contact.ownerId,
      },
    });
  });

  it('é idempotente para o mesmo externalId, inclusive em concorrência', async () => {
    const event = {
      accountPhoneNumberId: 'seed-phone-seller-1',
      externalId: 'wamid.integration.duplicate',
      from: '5511977776666',
      text: 'Duplicada',
      timestamp: '2026-11-10T16:05:00.000Z',
    };

    const [first, second] = await Promise.all([processor.process(event), processor.process(event)]);

    expect(first.messageId).toBe(second.messageId);
    expect([first.duplicate, second.duplicate]).toContain(true);

    const count = await prisma.message.count({
      where: { externalId: 'wamid.integration.duplicate' },
    });

    expect(count).toBe(1);
  });

  it('rejeita conta desconhecida como evento não processável', async () => {
    await expect(
      processor.process({
        accountPhoneNumberId: 'unknown-phone-number-id',
        externalId: 'wamid.integration.unknown',
        from: '5511977776666',
        text: 'Olá',
        timestamp: '2026-11-10T16:10:00.000Z',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEventError);
  });
});
