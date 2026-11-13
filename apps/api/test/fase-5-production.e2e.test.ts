import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const ADMIN_EMAIL = 'admin@nexo.local';

let context: TestContext;
let token: string;

beforeAll(async () => {
  process.env.PERSISTED_QUERIES_MODE = 'audit';
  context = await startTestApp({ nodeEnv: 'production' });

  const session = await request(context.server)
    .post('/auth/login')
    .send({ email: ADMIN_EMAIL, password: PASSWORD });

  expect(session.status).toBe(200);
  token = session.body.accessToken as string;
}, 180_000);

afterAll(async () => {
  await stopTestApp(context);
}, 60_000);

describe('Fase 5 — produção', () => {
  it('nega introspecção', async () => {
    const response = await request(context.server)
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'query { __schema { types { name } } }' });

    expect(response.body.data).toBeUndefined();
    expect(response.body.errors).toBeDefined();
  });

  it('não sugere campos alternativos em erro de validação', async () => {
    const response = await request(context.server)
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'query { me { nome } }' });

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).not.toMatch(/Did you mean/i);
    expect(response.body.errors[0].message).not.toContain('"name"');
  });
});
