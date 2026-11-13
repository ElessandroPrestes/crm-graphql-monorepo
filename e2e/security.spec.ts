import { createHmac } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PASSWORD, USERS } from './helpers/auth';
import { clearRateLimitCounters } from './helpers/redis';

const API_URL = 'http://127.0.0.1:3202';
const ADMIN_CONTACT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const E2E_ACCESS_SECRET = 'e2e-only-access-token-secret-32-chars';

interface LoginResult {
  accessToken: string;
  refreshCookie: string;
}

function refreshCookieOf(response: Response): string {
  const cookies = response.headers.getSetCookie();
  const cookie = cookies.find((value) => value.startsWith('nexo_refresh='));

  if (!cookie) {
    throw new Error('Cookie de refresh ausente');
  }

  return cookie.split(';')[0] ?? '';
}

async function apiLogin(email: string): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });

  expect(response.status, `login de ${email}`).toBe(200);
  const body = (await response.json()) as { accessToken: string };

  return { accessToken: body.accessToken, refreshCookie: refreshCookieOf(response) };
}

async function graphql(
  token: string | null,
  query: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: Record<string, unknown>; headers: Headers }> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: JSON.stringify({ query }),
  });

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    headers: response.headers,
  };
}

function signedExpiredToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: '11111111-1111-4111-8111-111111111111',
    email: USERS.admin.email,
    role: 'ADMIN',
    iat: now - 7200,
    exp: now - 3600,
  });
  const signature = createHmac('sha256', E2E_ACCESS_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function errorCodes(body: Record<string, unknown>): string[] {
  const errors = body.errors as Array<{ extensions?: { code?: string } }> | undefined;

  return errors?.map((error) => error.extensions?.code ?? '') ?? [];
}

test.describe.serial('segurança negativa', () => {
  test.beforeEach(() => {
    clearRateLimitCounters();
  });

  test('IDOR entre vendedores é negado sem vazar dados', async () => {
    const session = await apiLogin(USERS.sellerOne.email);
    const response = await graphql(
      session.accessToken,
      `query { contact(id: "${ADMIN_CONTACT_ID}") { id email phone } }`,
    );

    expect(response.status).toBe(200);
    expect(errorCodes(response.body)).toContain('NOT_FOUND');
    expect(JSON.stringify(response.body)).not.toContain('alice@acme.example.com');
  });

  test('token inválido e expirado são rejeitados', async () => {
    const query = `query { me { id email } }`;
    const invalid = await graphql('token-invalido', query);
    const expired = await graphql(signedExpiredToken(), query);

    for (const response of [invalid, expired]) {
      expect(response.status).toBe(200);
      expect(response.body.data ?? null).toBeNull();
      expect(errorCodes(response.body)).toContain('UNAUTHENTICATED');
    }
  });

  test('reuso de refresh revoga a família de tokens', async () => {
    const session = await apiLogin(USERS.sellerTwo.email);
    const first = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: session.refreshCookie },
    });
    expect(first.status).toBe(200);

    const reused = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: session.refreshCookie },
    });
    expect(reused.status).toBe(401);
  });

  test('HMAC inválido no webhook é rejeitado', async () => {
    const response = await fetch(`${API_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': 'sha256=invalida',
      },
      body: JSON.stringify({ object: 'whatsapp_business_account', entry: [] }),
    });

    expect(response.status).toBe(401);
  });

  test('WebSocket sem token é fechado sem aceitar conexão', async () => {
    const socket = new WebSocket('ws://127.0.0.1:3202/graphql', 'graphql-transport-ws');
    const closeCode = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket não fechou')), 10_000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'connection_init', payload: {} }));
      };
      socket.onclose = (event) => {
        clearTimeout(timer);
        resolve(event.code);
      };
      socket.onerror = () => {
        // O fechamento com código é a evidência esperada.
      };
    });

    expect([4401, 4403, 4500, 1008]).toContain(closeCode);
  });

  test('rate limit anônimo não é burlado com X-Forwarded-For forjado', async () => {
    const statuses: number[] = [];

    for (let index = 0; index < 7; index += 1) {
      const response = await graphql(
        null,
        `
          query {
            __typename
          }
        `,
        {
          'x-forwarded-for': `203.0.113.${index + 10}`,
        },
      );
      statuses.push(response.status);

      if (response.status === 429) {
        expect(response.headers.get('retry-after')).toBeTruthy();
      }
    }

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
