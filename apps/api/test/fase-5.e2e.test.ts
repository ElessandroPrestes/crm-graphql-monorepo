import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Redis } from 'ioredis';
import { PERSISTED_QUERIES } from '../src/graphql/persisted-queries.generated.js';
import { createClient } from 'graphql-ws';
import request from 'supertest';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const ADMIN_EMAIL = 'admin@nexo.local';
const SELLER_TWO_EMAIL = 'vendedor2@nexo.local';

let context: TestContext;
let redis: Redis;

function emailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function login(email: string, password = PASSWORD) {
  return request(context.server).post('/auth/login').send({ email, password });
}

function gql(query: string, variables?: Record<string, unknown>, token?: string) {
  const httpRequest = request(context.server)
    .post('/graphql')
    .set('apollo-require-preflight', 'true');

  if (token) {
    httpRequest.set('Authorization', `Bearer ${token}`);
  }

  return httpRequest.send({ query, variables });
}

beforeAll(async () => {
  process.env.PERSISTED_QUERIES_MODE = 'audit';
  process.env.RATE_LIMIT_LOGIN_IP_MAX = '1000';
  process.env.RATE_LIMIT_LOGIN_EMAIL_MAX = '1000';
  process.env.RATE_LIMIT_GRAPHQL_USER_MAX = '1000';
  process.env.RATE_LIMIT_GRAPHQL_ANON_MAX = '1000';
  process.env.RATE_LIMIT_GRAPHQL_WRITE_MAX = '1000';
  context = await startTestApp();
  redis = new Redis(`redis://${context.redis.getHost()}:${context.redis.getMappedPort(6379)}`);
}, 180_000);

afterAll(async () => {
  await redis.quit();
  await stopTestApp(context);
}, 60_000);

describe('Fase 5 — endurecimento GraphQL e autenticação', () => {
  it('bloqueia login acima do limite por IP com 429 e Retry-After', async () => {
    await redis.set('throttle:login:ip:127.0.0.1', '1000', 'EX', 900);
    await redis.set('throttle:login:ip:::1', '1000', 'EX', 900);

    const response = await login(ADMIN_EMAIL);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.body.message).toBe('Muitas tentativas. Tente novamente mais tarde.');

    await redis.del('throttle:login:ip:127.0.0.1', 'throttle:login:ip:::1');
  });

  it('bloqueia a conta após falhas repetidas e não revela se ela existe', async () => {
    const key = emailHash(SELLER_TWO_EMAIL);

    await redis.del(`throttle:login:fail:${key}`, `throttle:login:lock:${key}`);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(SELLER_TWO_EMAIL, 'SenhaErrada!2026');
    }

    const locked = await login(SELLER_TWO_EMAIL);

    expect(locked.status).toBe(429);
    expect(locked.body.message).toBe('Muitas tentativas. Tente novamente mais tarde.');
    expect(locked.body.message).not.toMatch(/vendedor|senha|conta/i);

    await redis.del(`throttle:login:fail:${key}`, `throttle:login:lock:${key}`);
  });

  it('limita GraphQL por usuário com 429 e Retry-After', async () => {
    const session = await login(ADMIN_EMAIL);
    const token = session.body.accessToken as string;
    const userId = session.body.user.id as string;

    await redis.set(`throttle:graphql:user:${userId}`, '1000', 'EX', 60);

    const response = await gql('query { me { id } }', undefined, token);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('RATE_LIMITED');

    await redis.del(`throttle:graphql:user:${userId}`);
  });

  it('rejeita corpo acima do limite com 413', async () => {
    const response = await request(context.server)
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .send({ query: `query { ${'me '.repeat(100_000)} }` });

    expect(response.status).toBe(413);
  });

  it('em audit, executa operação fora da allowlist e segue para o resolver', async () => {
    const response = await request(context.server)
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .send({
        query: 'query { __typename }',
        extensions: { persistedQuery: { version: 1, sha256Hash: 'not-in-allowlist' } },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.__typename).toBe('Query');
  });

  it('fecha handshake WebSocket acima do limite com código observável', async () => {
    const session = await login(ADMIN_EMAIL);
    const token = session.body.accessToken as string;

    await redis.set('throttle:ws:ip:127.0.0.1', '1000', 'EX', 60);
    await redis.set('throttle:ws:ip:::1', '1000', 'EX', 60);

    const closeCode = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 5_000);
      const client = createClient({
        url: context.wsUrl,
        webSocketImpl: WebSocket,
        connectionParams: { authorization: `Bearer ${token}` },
        retryAttempts: 0,
        on: {
          closed: (event) => {
            clearTimeout(timeout);
            resolve((event as { code?: number }).code ?? 0);
          },
        },
      });

      client
        .iterate({ query: 'subscription { messageReceived { id } }' })
        .next()
        .catch(() => {
          void client.dispose();
        });
    });

    expect(closeCode).toBe(4429);

    await redis.del('throttle:ws:ip:127.0.0.1', 'throttle:ws:ip:::1');
  });

  it('executa persisted query conhecida apenas pelo hash', async () => {
    const session = await login(ADMIN_EMAIL);
    const token = session.body.accessToken as string;
    const entry = Object.values(PERSISTED_QUERIES).find((item) => item.name === 'Me');

    expect(entry).toBeDefined();

    const sha256Hash = Object.entries(PERSISTED_QUERIES).find(([, item]) => item.name === 'Me')![0];

    const response = await request(context.server)
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .set('Authorization', `Bearer ${token}`)
      .send({
        extensions: { persistedQuery: { version: 1, sha256Hash } },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.me.email).toBe(ADMIN_EMAIL);
  });
});
