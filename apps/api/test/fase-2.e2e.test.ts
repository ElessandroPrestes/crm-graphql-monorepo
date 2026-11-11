import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const ADMIN_EMAIL = 'admin@nexo.local';
const SELLER_ONE_EMAIL = 'vendedor1@nexo.local';
const SELLER_TWO_EMAIL = 'vendedor2@nexo.local';
const GLOBEX_COMPANY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
const GLOBEX_CONTACT_ONE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
const INITECH_CONTACT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5';
const SELLER_ONE_DEAL_ID = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';

let context: TestContext;

interface LoginResult {
  token: string;
}

async function login(email: string, password = PASSWORD): Promise<LoginResult> {
  const response = await request(context.server).post('/auth/login').send({ email, password });

  expect(response.status).toBe(200);

  return { token: response.body.accessToken as string };
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

const CREATE_DEAL = `mutation CreateDeal($input: CreateDealInput!) {
  createDeal(input: $input) {
    id title stage version valueCents closedAt contactId companyId
  }
}`;

const UPDATE_DEAL = `mutation UpdateDeal($id: ID!, $input: UpdateDealInput!) {
  updateDeal(id: $id, input: $input) {
    id title stage version valueCents closedAt
  }
}`;

const CREATE_ACTIVITY = `mutation CreateActivity($input: CreateActivityInput!) {
  createActivity(input: $input) { id type subject occurredAt dealId contactId }
}`;

async function createDeal(
  token: string,
  input: Record<string, unknown>,
): Promise<{ id: string; stage: string; version: number; valueCents: number }> {
  const response = await gql(CREATE_DEAL, { input }, token);

  expect(response.body.errors).toBeUndefined();

  return response.body.data.createDeal;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(async () => {
  context = await startTestApp();
}, 180_000);

afterAll(async () => {
  await stopTestApp(context);
}, 60_000);

describe('Fase 2 — funil, atividades, dashboard e subscriptions', () => {
  it('cria, lista e atualiza negócios com validação de vínculo', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const created = await createDeal(seller.token, {
      title: 'Expansão Globex',
      valueCents: 500000,
      contactId: GLOBEX_CONTACT_ONE_ID,
      companyId: GLOBEX_COMPANY_ID,
    });

    expect(created).toMatchObject({ stage: 'LEAD', version: 1, valueCents: 500000 });

    const list = await gql(
      '{ deals(first: 2) { edges { node { id } } pageInfo { hasNextPage } } }',
      undefined,
      seller.token,
    );

    expect(list.body.errors).toBeUndefined();
    expect(list.body.data.deals.edges).toHaveLength(2);

    const updated = await gql(
      UPDATE_DEAL,
      {
        id: created.id,
        input: { title: 'Expansão Globex v2', stage: 'QUALIFIED', expectedVersion: 1 },
      },
      seller.token,
    );

    expect(updated.body.errors).toBeUndefined();
    expect(updated.body.data.updateDeal).toMatchObject({
      title: 'Expansão Globex v2',
      stage: 'QUALIFIED',
      version: 2,
      closedAt: null,
    });
  });

  it('rejeita vínculo e leitura de recurso de outro vendedor', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const other = await login(SELLER_TWO_EMAIL);
    const admin = await login(ADMIN_EMAIL);

    const foreignContact = await gql(
      CREATE_DEAL,
      { input: { title: 'Vínculo indevido', contactId: INITECH_CONTACT_ID } },
      seller.token,
    );

    expect(foreignContact.body.errors[0].extensions.code).toBe('NOT_FOUND');

    const forbidden = await gql(
      '{ deal(id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2") { id ownerId } }',
      undefined,
      other.token,
    );

    expect(forbidden.body.errors[0].extensions.code).toBe('NOT_FOUND');

    const allowed = await gql(
      '{ deal(id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2") { id title } }',
      undefined,
      admin.token,
    );

    expect(allowed.body.errors).toBeUndefined();
    expect(allowed.body.data.deal.id).toBe(SELLER_ONE_DEAL_ID);
  });

  it('detecta conflito de concorrência otimista', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const deal = await createDeal(seller.token, { title: 'Concorrência', valueCents: 1000 });

    const first = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'QUALIFIED', expectedVersion: 1 } },
      seller.token,
    );

    expect(first.body.errors).toBeUndefined();
    expect(first.body.data.updateDeal.version).toBe(2);

    const second = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'PROPOSAL', expectedVersion: 1 } },
      seller.token,
    );

    expect(second.body.errors[0].extensions.code).toBe('CONFLICT');
  });

  it('encerra o negócio e bloqueia novos movimentos', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const deal = await createDeal(seller.token, { title: 'Fechamento', valueCents: 2000 });

    const won = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'WON', expectedVersion: 1 } },
      seller.token,
    );

    expect(won.body.errors).toBeUndefined();
    expect(won.body.data.updateDeal.stage).toBe('WON');
    expect(won.body.data.updateDeal.closedAt).not.toBeNull();

    const reopen = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'LEAD', expectedVersion: 2 } },
      seller.token,
    );

    expect(reopen.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('lista a timeline por negócio com cursor estável', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const deal = await createDeal(seller.token, { title: 'Timeline', valueCents: 3000 });

    for (const [index, occurredAt] of [
      '2026-11-07T10:00:00.000Z',
      '2026-11-08T10:00:00.000Z',
      '2026-11-09T10:00:00.000Z',
    ].entries()) {
      const response = await gql(
        CREATE_ACTIVITY,
        {
          input: {
            type: 'CALL',
            subject: `Atividade ${index}`,
            occurredAt,
            dealId: deal.id,
          },
        },
        seller.token,
      );

      expect(response.body.errors).toBeUndefined();
    }

    const pageOne = await gql(
      'query Activities($dealId: ID!) { activities(dealId: $dealId, first: 2) { edges { cursor node { id occurredAt } } pageInfo { hasNextPage endCursor } } }',
      { dealId: deal.id },
      seller.token,
    );

    expect(pageOne.body.errors).toBeUndefined();
    expect(pageOne.body.data.activities.edges).toHaveLength(2);
    expect(pageOne.body.data.activities.pageInfo.hasNextPage).toBe(true);
    expect(pageOne.body.data.activities.edges[0].node.occurredAt).toBe('2026-11-09T10:00:00.000Z');

    const pageTwo = await gql(
      'query Activities($dealId: ID!, $after: String) { activities(dealId: $dealId, first: 2, after: $after) { edges { node { occurredAt } } pageInfo { hasNextPage } } }',
      { dealId: deal.id, after: pageOne.body.data.activities.pageInfo.endCursor },
      seller.token,
    );

    expect(pageTwo.body.errors).toBeUndefined();
    expect(pageTwo.body.data.activities.edges).toHaveLength(1);
    expect(pageTwo.body.data.activities.pageInfo.hasNextPage).toBe(false);

    const withoutRelation = await gql(
      CREATE_ACTIVITY,
      { input: { type: 'NOTE', subject: 'Sem vínculo', occurredAt: '2026-11-09T10:00:00.000Z' } },
      seller.token,
    );

    expect(withoutRelation.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('invalida o cache do dashboard após mudança de negócio', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const metricsQuery =
      '{ dashboardMetrics { openDeals openValueCents wonDeals stages { stage count valueCents } } }';

    const before = await gql(metricsQuery, undefined, seller.token);

    expect(before.body.errors).toBeUndefined();

    await createDeal(seller.token, { title: 'Cache', valueCents: 12345 });

    const after = await gql(metricsQuery, undefined, seller.token);

    expect(after.body.errors).toBeUndefined();
    expect(after.body.data.dashboardMetrics.openDeals).toBe(
      before.body.data.dashboardMetrics.openDeals + 1,
    );
    expect(after.body.data.dashboardMetrics.openValueCents).toBe(
      before.body.data.dashboardMetrics.openValueCents + 12345,
    );
  });

  it('entrega dealMoved apenas para quem pode acessar o negócio', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const deal = await createDeal(seller.token, { title: 'Tempo real', valueCents: 4000 });
    const client = createClient({
      url: context.wsUrl,
      webSocketImpl: WebSocket,
      connectionParams: { authorization: `Bearer ${seller.token}` },
      retryAttempts: 0,
    });
    const iterator = client.iterate<{
      dealMoved: { id: string; stage: string; version: number };
    }>({
      query: 'subscription($dealId: ID) { dealMoved(dealId: $dealId) { id stage version } }',
      variables: { dealId: deal.id },
    });
    const pending = iterator.next();

    await wait(400);

    const moved = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'QUALIFIED', expectedVersion: 1 } },
      seller.token,
    );

    expect(moved.body.errors).toBeUndefined();

    const event = await pending;

    expect(event.value?.data?.dealMoved).toMatchObject({
      id: deal.id,
      stage: 'QUALIFIED',
      version: 2,
    });

    await iterator.return?.();
    await client.dispose();

    const other = await login(SELLER_TWO_EMAIL);
    const otherClient = createClient({
      url: context.wsUrl,
      webSocketImpl: WebSocket,
      connectionParams: { authorization: `Bearer ${other.token}` },
      retryAttempts: 0,
    });
    const otherIterator = otherClient.iterate({
      query: 'subscription($dealId: ID) { dealMoved(dealId: $dealId) { id } }',
      variables: { dealId: deal.id },
    });
    const otherPending = otherIterator.next().then(
      () => 'event',
      () => 'error',
    );

    await wait(400);

    const admin = await login(ADMIN_EMAIL);
    const adminMove = await gql(
      UPDATE_DEAL,
      { id: deal.id, input: { stage: 'PROPOSAL', expectedVersion: 2 } },
      admin.token,
    );

    expect(adminMove.body.errors).toBeUndefined();

    const outcome = await Promise.race([otherPending, wait(1000).then(() => 'timeout')]);

    expect(outcome).toBe('timeout');

    await otherIterator.return?.();
    await otherClient.dispose();
  });

  it('rejeita conexão de subscription sem token', async () => {
    const client = createClient({
      url: context.wsUrl,
      webSocketImpl: WebSocket,
      retryAttempts: 0,
    });
    const iterator = client.iterate({ query: 'subscription { dealMoved { id } }' });
    const outcome = await Promise.race([
      iterator
        .next()
        .then(() => 'accepted')
        .catch(() => 'rejected'),
      wait(2000).then(() => 'timeout'),
    ]);

    expect(outcome).toBe('rejected');

    await client.dispose();
  });
});
