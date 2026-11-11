import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const ADMIN_EMAIL = 'admin@nexo.local';
const SELLER_ONE_EMAIL = 'vendedor1@nexo.local';
const SELLER_TWO_EMAIL = 'vendedor2@nexo.local';
const SELLER_TWO_COMPANY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

let context: TestContext;

interface LoginResult {
  token: string;
  cookie: string;
}

async function login(email: string, password = PASSWORD): Promise<LoginResult> {
  const response = await request(context.server).post('/auth/login').send({ email, password });

  expect(response.status).toBe(200);

  const setCookie = response.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  return {
    token: response.body.accessToken as string,
    cookie: cookieHeader?.split(';')[0] ?? '',
  };
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

describe('Fase 1 — autenticação e isolamento', () => {
  it('faz login, protege rotas e não expõe a senha', async () => {
    const response = await request(context.server)
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: ADMIN_EMAIL,
      role: 'ADMIN',
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(response.headers['set-cookie']?.toString()).toMatch(/HttpOnly/);
    expect(response.headers['set-cookie']?.toString()).toMatch(/SameSite=Strict/);

    const invalid = await request(context.server)
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'senha-incorreta' });

    expect(invalid.status).toBe(401);

    const me = await request(context.server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${response.body.accessToken as string}`);

    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: ADMIN_EMAIL, role: 'ADMIN' });

    const withoutToken = await request(context.server).get('/auth/me');
    expect(withoutToken.status).toBe(401);

    const blockedOrigin = await request(context.server)
      .post('/auth/login')
      .set('Origin', 'http://evil.example')
      .send({ email: ADMIN_EMAIL, password: PASSWORD });

    expect(blockedOrigin.status).toBe(403);
  });

  it('rejeita GraphQL sem token e aceita com token', async () => {
    const admin = await login(ADMIN_EMAIL);

    const unauthenticated = await gql('{ contacts { edges { node { id } } } }');
    expect(unauthenticated.status).toBe(200);
    expect(unauthenticated.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');

    const authenticated = await gql(
      '{ me { email role } contacts(first: 1) { edges { node { id } } } }',
      undefined,
      admin.token,
    );

    expect(authenticated.body.errors).toBeUndefined();
    expect(authenticated.body.data.me).toMatchObject({
      email: ADMIN_EMAIL,
      role: 'ADMIN',
    });
  });

  it('rotaciona refresh, detecta reuso e revoga a família', async () => {
    const seller = await login(SELLER_ONE_EMAIL);

    const refreshed = await request(context.server)
      .post('/auth/refresh')
      .set('Cookie', seller.cookie);

    expect(refreshed.status).toBe(200);
    const nextCookie = refreshed.headers['set-cookie']?.[0]?.split(';')[0] ?? '';
    expect(nextCookie).not.toBe(seller.cookie);

    const reused = await request(context.server).post('/auth/refresh').set('Cookie', seller.cookie);

    expect(reused.status).toBe(401);

    const revokedFamily = await request(context.server)
      .post('/auth/refresh')
      .set('Cookie', nextCookie);

    expect(revokedFamily.status).toBe(401);
  });

  it('armazena senha e refresh somente como hash', async () => {
    const admin = await login(ADMIN_EMAIL);
    const prisma = context.app.get(PrismaService);

    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user?.passwordHash).not.toContain(PASSWORD);

    const rawRefreshToken = admin.cookie.slice(admin.cookie.indexOf('=') + 1);
    const storedTokens = await prisma.refreshToken.findMany({
      select: { tokenHash: true },
    });

    expect(storedTokens.some(({ tokenHash }) => tokenHash === rawRefreshToken)).toBe(false);
    expect(storedTokens.every(({ tokenHash }) => tokenHash.length === 64)).toBe(true);
  });

  it('faz logout e invalida o refresh', async () => {
    const seller = await login(SELLER_ONE_EMAIL);

    const logout = await request(context.server).post('/auth/logout').set('Cookie', seller.cookie);

    expect(logout.status).toBe(204);

    const refreshAfterLogout = await request(context.server)
      .post('/auth/refresh')
      .set('Cookie', seller.cookie);

    expect(refreshAfterLogout.status).toBe(401);
  });
});

describe('Fase 1 — RBAC por propriedade', () => {
  it('impede que um vendedor acesse registros de outro', async () => {
    const sellerOne = await login(SELLER_ONE_EMAIL);
    const sellerTwo = await login(SELLER_TWO_EMAIL);
    const admin = await login(ADMIN_EMAIL);

    const company = await gql(
      'mutation($input: CreateCompanyInput!) { createCompany(input: $input) { id ownerId } }',
      { input: { name: 'Vera Corp', domain: 'vera.example.com' } },
      sellerOne.token,
    );
    const companyId = company.body.data.createCompany.id as string;

    const contact = await gql(
      'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
      {
        input: {
          firstName: 'Vera',
          lastName: 'Cliente',
          email: 'vera.cliente@example.com',
          companyId,
        },
      },
      sellerOne.token,
    );
    const contactId = contact.body.data.createContact.id as string;

    const forbiddenRead = await gql(
      'query($id: ID!) { contact(id: $id) { id } }',
      { id: contactId },
      sellerTwo.token,
    );
    expect(forbiddenRead.body.errors[0].extensions.code).toBe('NOT_FOUND');

    const forbiddenUpdate = await gql(
      'mutation($id: ID!) { updateContact(id: $id, input: { firstName: "Invasão" }) { id } }',
      { id: contactId },
      sellerTwo.token,
    );
    expect(forbiddenUpdate.body.errors[0].extensions.code).toBe('NOT_FOUND');

    const adminRead = await gql(
      'query($id: ID!) { contact(id: $id) { id ownerId company { id } } }',
      { id: contactId },
      admin.token,
    );
    expect(adminRead.body.data.contact.id).toBe(contactId);

    const invalidCompany = await gql(
      'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
      {
        input: {
          firstName: 'Vitor',
          lastName: 'Indevido',
          email: 'vitor.indevido@example.com',
          companyId: SELLER_TWO_COMPANY_ID,
        },
      },
      sellerOne.token,
    );
    expect(invalidCompany.body.errors[0].message).toBe('Empresa inválida');

    const sellerTwoList = await gql(
      '{ contacts(first: 100) { edges { node { id } } } }',
      undefined,
      sellerTwo.token,
    );
    const sellerTwoIds = (
      sellerTwoList.body.data.contacts.edges as Array<{ node: { id: string } }>
    ).map((edge) => edge.node.id);
    expect(sellerTwoIds).not.toContain(contactId);

    const adminList = await gql(
      '{ contacts(first: 100) { edges { node { id } } } }',
      undefined,
      admin.token,
    );
    const adminIds = (adminList.body.data.contacts.edges as Array<{ node: { id: string } }>).map(
      (edge) => edge.node.id,
    );
    expect(adminIds).toContain(contactId);
  });
});

describe('Fase 1 — CRUD, paginação e limites', () => {
  it('faz CRUD de empresa e protege a exclusão com contatos', async () => {
    const seller = await login(SELLER_ONE_EMAIL);

    const created = await gql(
      'mutation($input: CreateCompanyInput!) { createCompany(input: $input) { id name domain } }',
      { input: { name: 'Globex Filial', domain: 'filial.globex.example.com' } },
      seller.token,
    );
    const companyId = created.body.data.createCompany.id as string;

    const updated = await gql(
      'mutation($id: ID!, $input: UpdateCompanyInput!) { updateCompany(id: $id, input: $input) { id name } }',
      { id: companyId, input: { name: 'Globex Filial Atualizada' } },
      seller.token,
    );
    expect(updated.body.data.updateCompany.name).toBe('Globex Filial Atualizada');

    const duplicate = await gql(
      'mutation { createCompany(input: { name: "Outra", domain: "filial.globex.example.com" }) { id } }',
      undefined,
      seller.token,
    );
    expect(duplicate.body.errors[0].extensions.code).toBe('BAD_REQUEST');

    const contact = await gql(
      'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
      {
        input: {
          firstName: 'Teste',
          lastName: 'Exclusão',
          email: 'teste.exclusao@example.com',
          companyId,
        },
      },
      seller.token,
    );
    const contactId = contact.body.data.createContact.id as string;

    const blockedDelete = await gql(
      'mutation($id: ID!) { deleteCompany(id: $id) }',
      { id: companyId },
      seller.token,
    );
    expect(blockedDelete.body.errors[0].message).toBe('Empresa possui contatos vinculados');

    const deleteContact = await gql(
      'mutation($id: ID!) { deleteContact(id: $id) }',
      { id: contactId },
      seller.token,
    );
    expect(deleteContact.body.data.deleteContact).toBe(true);

    const deleteCompany = await gql(
      'mutation($id: ID!) { deleteCompany(id: $id) }',
      { id: companyId },
      seller.token,
    );
    expect(deleteCompany.body.data.deleteCompany).toBe(true);
  });

  it('pagina por cursor e valida first e cursor', async () => {
    const seller = await login(SELLER_TWO_EMAIL);

    for (let index = 0; index < 25; index += 1) {
      const created = await gql(
        'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
        {
          input: {
            firstName: `Contato${index}`,
            lastName: 'Paginado',
            email: `paginado-${index}@example.com`,
          },
        },
        seller.token,
      );

      expect(created.body.errors).toBeUndefined();
    }

    const firstPage = await gql(
      '{ contacts(first: 10) { edges { node { id } } pageInfo { hasNextPage endCursor } } }',
      undefined,
      seller.token,
    );
    const firstEdges = firstPage.body.data.contacts.edges as Array<{
      node: { id: string };
    }>;
    expect(firstEdges).toHaveLength(10);
    expect(firstPage.body.data.contacts.pageInfo.hasNextPage).toBe(true);

    const endCursor = firstPage.body.data.contacts.pageInfo.endCursor as string;
    const secondPage = await gql(
      'query($after: String) { contacts(first: 10, after: $after) { edges { node { id } } } }',
      { after: endCursor },
      seller.token,
    );
    const secondEdges = secondPage.body.data.contacts.edges as Array<{
      node: { id: string };
    }>;
    const firstIds = firstEdges.map((edge) => edge.node.id);
    const secondIds = secondEdges.map((edge) => edge.node.id);

    expect(secondEdges).toHaveLength(10);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);

    const tooLarge = await gql(
      '{ contacts(first: 101) { edges { node { id } } } }',
      undefined,
      seller.token,
    );
    expect(tooLarge.body.errors[0].extensions.code).toBe('BAD_REQUEST');

    const invalidCursor = await gql(
      '{ contacts(first: 10, after: "invalido") { edges { node { id } } } }',
      undefined,
      seller.token,
    );
    expect(invalidCursor.body.errors[0].extensions.code).toBe('BAD_REQUEST');
  });

  it('aplica limite de aliases e resolve empresa via DataLoader', async () => {
    const admin = await login(ADMIN_EMAIL);

    const aliases = Array.from({ length: 11 }, (_, index) => `a${index}: me { id }`).join('\n');
    const limited = await gql(`query { ${aliases} }`, undefined, admin.token);

    expect(limited.body.errors[0].message).toContain('aliases');

    const expensive = Array.from(
      { length: 10 },
      (_, index) => `c${index}: contacts(first: 100) { edges { node { id } } }`,
    ).join('\n');
    const complex = await gql(`query { ${expensive} }`, undefined, admin.token);
    expect(complex.body.errors[0].message.toLowerCase()).toContain('complexidade');

    const contactsWithCompany = await gql(
      '{ contacts(first: 5) { edges { node { id company { id name ownerId } } } } }',
      undefined,
      admin.token,
    );

    expect(contactsWithCompany.body.errors).toBeUndefined();
    expect(contactsWithCompany.body.data.contacts.edges.length).toBeGreaterThan(0);
  });
});
