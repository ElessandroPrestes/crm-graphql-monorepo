import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const SELLER_ONE_EMAIL = 'vendedor1@nexo.local';
const SELLER_TWO_EMAIL = 'vendedor2@nexo.local';
const ADMIN_EMAIL = 'admin@nexo.local';
const GLOBEX_CONTACT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
const INITECH_COMPANY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

let context: TestContext;

async function login(email: string): Promise<string> {
  const response = await request(context.server)
    .post('/auth/login')
    .send({ email, password: PASSWORD });

  expect(response.status).toBe(200);

  return response.body.accessToken as string;
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
  context = await startTestApp();
}, 180_000);

afterAll(async () => {
  await stopTestApp(context);
}, 60_000);

describe('Fase 4 — filtros aditivos e autorização', () => {
  it('busca contatos por nome, e-mail ou telefone no escopo do dono', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const sellerTwo = await login(SELLER_TWO_EMAIL);

    const byName = await gql(
      `query { contacts(search: "Carla") { edges { node { id firstName } } } }`,
      undefined,
      sellerOne,
    );
    expect(byName.body.errors).toBeUndefined();
    expect(byName.body.data.contacts.edges).toHaveLength(1);
    expect(byName.body.data.contacts.edges[0].node.firstName).toBe('Carla');

    const byPhone = await gql(
      `query { contacts(search: "90000-0003") { edges { node { firstName } } } }`,
      undefined,
      sellerOne,
    );
    expect(byPhone.body.data.contacts.edges).toHaveLength(1);

    const otherOwner = await gql(
      `query { contacts(search: "Carla") { edges { node { id } } } }`,
      undefined,
      sellerTwo,
    );
    expect(otherOwner.body.data.contacts.edges).toHaveLength(0);
  });

  it('filtra contatos por empresa sem vazar registros de outro dono', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const admin = await login(ADMIN_EMAIL);

    const denied = await gql(
      `query ($companyId: ID) { contacts(companyId: $companyId) { edges { node { id } } } }`,
      { companyId: INITECH_COMPANY_ID },
      sellerOne,
    );
    expect(denied.body.data.contacts.edges).toHaveLength(0);

    const allowed = await gql(
      `query ($companyId: ID) { contacts(companyId: $companyId) { edges { node { firstName } } } }`,
      { companyId: INITECH_COMPANY_ID },
      admin,
    );
    expect(allowed.body.data.contacts.edges).toHaveLength(1);
    expect(allowed.body.data.contacts.edges[0].node.firstName).toBe('Elisa');
  });

  it('filtra negócios por contato, etapa e busca preservando o escopo', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const admin = await login(ADMIN_EMAIL);

    const byContact = await gql(
      `query ($contactId: ID) { deals(contactId: $contactId) { edges { node { title stage } } } }`,
      { contactId: GLOBEX_CONTACT_ID },
      sellerOne,
    );
    expect(byContact.body.errors).toBeUndefined();
    expect(byContact.body.data.deals.edges).toHaveLength(1);
    expect(byContact.body.data.deals.edges[0].node.title).toBe('Implantação Globex');

    const byStage = await gql(
      `query { deals(stages: [WON]) { edges { node { stage } } } }`,
      undefined,
      sellerOne,
    );
    expect(byStage.body.data.deals.edges).toHaveLength(1);
    expect(byStage.body.data.deals.edges[0].node.stage).toBe('WON');

    const sellerSearch = await gql(
      `query { deals(search: "Initech") { edges { node { id } } } }`,
      undefined,
      sellerOne,
    );
    expect(sellerSearch.body.data.deals.edges).toHaveLength(0);

    const adminSearch = await gql(
      `query { deals(search: "Initech") { edges { node { title } } } }`,
      undefined,
      admin,
    );
    expect(adminSearch.body.data.deals.edges).toHaveLength(2);
  });

  it('filtra conversas por contato e nome do contato no escopo do dono', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const sellerTwo = await login(SELLER_TWO_EMAIL);

    const byContact = await gql(
      `query ($contactId: ID) { conversations(contactId: $contactId) { edges { node { id } } } }`,
      { contactId: GLOBEX_CONTACT_ID },
      sellerOne,
    );
    expect(byContact.body.errors).toBeUndefined();
    expect(byContact.body.data.conversations.edges).toHaveLength(1);

    const denied = await gql(
      `query ($contactId: ID) { conversations(contactId: $contactId) { edges { node { id } } } }`,
      { contactId: GLOBEX_CONTACT_ID },
      sellerTwo,
    );
    expect(denied.body.data.conversations.edges).toHaveLength(0);

    const bySearch = await gql(
      `query { conversations(search: "Carla") { edges { node { id } } } }`,
      undefined,
      sellerOne,
    );
    expect(bySearch.body.data.conversations.edges).toHaveLength(1);

    const noMatch = await gql(
      `query { conversations(search: "Initech") { edges { node { id } } } }`,
      undefined,
      sellerOne,
    );
    expect(noMatch.body.data.conversations.edges).toHaveLength(0);
  });

  it('rejeita busca acima do limite', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const response = await gql(
      `query ($search: String) { contacts(search: $search) { edges { node { id } } } }`,
      { search: 'a'.repeat(101) },
      sellerOne,
    );

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toMatch(/100/);
  });
});
