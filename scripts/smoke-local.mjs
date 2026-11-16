#!/usr/bin/env node

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3202';
const WEB_URL = process.env.WEB_URL ?? 'http://127.0.0.1:5217';
const EMAIL = process.env.SMOKE_EMAIL ?? 'admin@nexo.local';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'NexoDemo!2026';
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 60000);
const INTERVAL_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(name, url, validate) {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastError = new Error('sem tentativa');

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const body = await response.text();

      if (response.ok && validate(body)) {
        return;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    await sleep(INTERVAL_MS);
  }

  throw new Error(`${name} não respondeu em ${TIMEOUT_MS}ms: ${lastError.message}`);
}

async function main() {
  await waitFor('API liveness', `${API_URL}/health/live`, (body) => {
    const payload = JSON.parse(body);
    return payload.status === 'ok' && payload.service === 'api';
  });

  await waitFor('API readiness', `${API_URL}/health/ready`, (body) => {
    const payload = JSON.parse(body);
    return payload.status === 'ok';
  });

  await waitFor('Web', `${WEB_URL}/healthz`, (body) => body.trim() === 'ok');

  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!loginResponse.ok) {
    throw new Error(`login de ${EMAIL} falhou: HTTP ${loginResponse.status}`);
  }

  const login = await loginResponse.json();

  if (typeof login.accessToken !== 'string' || login.accessToken.length === 0) {
    throw new Error('login não retornou accessToken');
  }

  const graphqlResponse = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${login.accessToken}`,
    },
    body: JSON.stringify({ query: 'query { me { email role } }' }),
  });

  const graphql = await graphqlResponse.json();

  if (!graphqlResponse.ok || graphql.errors?.length > 0) {
    throw new Error(`GraphQL falhou: HTTP ${graphqlResponse.status}`);
  }

  if (graphql.data?.me?.email !== EMAIL) {
    throw new Error(`GraphQL retornou usuário inesperado: ${graphql.data?.me?.email ?? 'vazio'}`);
  }

  console.log(`smoke ok: API, web, login e GraphQL (${EMAIL})`);
}

main().catch((error) => {
  console.error(`smoke falhou: ${error.message}`);
  process.exitCode = 1;
});
