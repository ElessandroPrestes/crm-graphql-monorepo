import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect } from 'amqplib';
import { createClient } from 'graphql-ws';
import { Redis } from 'ioredis';
import request from 'supertest';
import WebSocket from 'ws';
import { MESSAGE_RECEIVED_CHANNEL, WHATSAPP_INBOUND_QUEUE } from '@nexo/shared';
import { startTestApp, stopTestApp, type TestContext } from './helpers/test-app.js';

const PASSWORD = 'NexoDemo!2026';
const SELLER_ONE_EMAIL = 'vendedor1@nexo.local';
const SELLER_TWO_EMAIL = 'vendedor2@nexo.local';
const SELLER_ONE_CONVERSATION_ID = 'abababab-abab-4bab-8bab-abababababa1';
const GLOBEX_CONTACT_ONE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
const SELLER_ONE_ACCOUNT_PHONE_NUMBER_ID = 'seed-phone-seller-1';
const APP_SECRET = 'test-only-whatsapp-app-secret';
const VERIFY_TOKEN = 'test-only-whatsapp-verify-token';

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function webhookPayload(externalId: string, from = '5511977776666') {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-e2e',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511800000001',
                phone_number_id: SELLER_ONE_ACCOUNT_PHONE_NUMBER_ID,
              },
              contacts: [{ wa_id: from, profile: { name: 'Cliente E2E' } }],
              messages: [
                {
                  id: externalId,
                  from,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: 'Mensagem E2E' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function signatureOf(raw: string): string {
  return `sha256=${createHmac('sha256', APP_SECRET).update(raw).digest('hex')}`;
}

function redisUrl(): string {
  return `redis://${context.redis.getHost()}:${context.redis.getMappedPort(6379)}`;
}

beforeAll(async () => {
  context = await startTestApp({ rabbitmq: true });
}, 240_000);

afterAll(async () => {
  await stopTestApp(context);
}, 180_000);

describe('Fase 3 — WhatsApp, mensagens e LGPD', () => {
  it('valida o handshake do webhook', async () => {
    const denied = await request(context.server).get('/webhooks/whatsapp').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'abc',
    });

    expect(denied.status).toBe(403);

    const accepted = await request(context.server).get('/webhooks/whatsapp').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'abc',
    });

    expect(accepted.status).toBe(200);
    expect(accepted.text).toBe('abc');
  });

  it('rejeita assinatura inválida e publica evento válido na fila', async () => {
    const payload = webhookPayload('wamid.e2e.invalid');
    const raw = JSON.stringify(payload);

    const invalid = await request(context.server)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', 'sha256=deadbeef')
      .send(raw);

    expect(invalid.status).toBe(401);

    const valid = await request(context.server)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signatureOf(raw))
      .send(raw);

    expect(valid.status).toBe(200);
    expect(valid.body).toEqual({ status: 'accepted' });

    const malformed = await request(context.server)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signatureOf('{'))
      .send('{');

    expect(malformed.status).toBe(400);

    const oversized = JSON.stringify({ object: 'x', padding: 'a'.repeat(1_100_000) });
    const tooLarge = await request(context.server)
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signatureOf(oversized))
      .send(oversized);

    expect(tooLarge.status).toBe(413);

    const connection = await connect(process.env.RABBITMQ_URL ?? '');

    try {
      const channel = await connection.createChannel();
      const queue = await channel.checkQueue(WHATSAPP_INBOUND_QUEUE);

      expect(queue.messageCount).toBeGreaterThanOrEqual(1);
      await channel.close();
    } finally {
      await connection.close();
    }
  });

  it('lista conversas e envia mensagem idempotente', async () => {
    const token = await login(SELLER_ONE_EMAIL);
    const conversations = await gql(
      '{ conversations(first: 10) { edges { node { id ownerId contactId lastMessageAt } } } }',
      undefined,
      token,
    );

    expect(conversations.body.errors).toBeUndefined();
    expect(
      conversations.body.data.conversations.edges.map(
        (edge: { node: { id: string } }) => edge.node.id,
      ),
    ).toContain(SELLER_ONE_CONVERSATION_ID);

    const first = await gql(
      'mutation($input: SendMessageInput!) { sendMessage(input: $input) { id body status externalId clientMessageId } }',
      {
        input: {
          conversationId: SELLER_ONE_CONVERSATION_ID,
          text: 'Mensagem idempotente E2E',
          clientMessageId: 'e2e-client-message-1',
        },
      },
      token,
    );

    expect(first.body.errors).toBeUndefined();
    expect(first.body.data.sendMessage).toMatchObject({
      body: 'Mensagem idempotente E2E',
      status: 'SENT',
      clientMessageId: 'e2e-client-message-1',
    });
    expect(first.body.data.sendMessage.externalId).toMatch(/^mock\./);

    const second = await gql(
      'mutation($input: SendMessageInput!) { sendMessage(input: $input) { id } }',
      {
        input: {
          conversationId: SELLER_ONE_CONVERSATION_ID,
          text: 'Mensagem idempotente E2E',
          clientMessageId: 'e2e-client-message-1',
        },
      },
      token,
    );

    expect(second.body.errors).toBeUndefined();
    expect(second.body.data.sendMessage.id).toBe(first.body.data.sendMessage.id);

    const messages = await gql(
      'query($id: ID!) { messages(conversationId: $id, first: 10) { edges { node { id body direction status } } } }',
      { id: SELLER_ONE_CONVERSATION_ID },
      token,
    );

    expect(messages.body.errors).toBeUndefined();
    expect(
      messages.body.data.messages.edges.some(
        (edge: { node: { id: string } }) => edge.node.id === first.body.data.sendMessage.id,
      ),
    ).toBe(true);
  });

  it('impede acesso de outro vendedor à conversa', async () => {
    const token = await login(SELLER_TWO_EMAIL);
    const response = await gql(
      'query($id: ID!) { conversation(id: $id) { id } }',
      { id: SELLER_ONE_CONVERSATION_ID },
      token,
    );

    expect(response.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('entrega messageReceived para o dono e respeita o filtro de conversa', async () => {
    const token = await login(SELLER_ONE_EMAIL);
    const conversation = await gql(
      'query($id: ID!) { conversation(id: $id) { id ownerId } }',
      { id: SELLER_ONE_CONVERSATION_ID },
      token,
    );
    const ownerId = conversation.body.data.conversation.ownerId as string;
    const sent = await gql(
      'mutation($input: SendMessageInput!) { sendMessage(input: $input) { id } }',
      {
        input: {
          conversationId: SELLER_ONE_CONVERSATION_ID,
          text: 'Evento em tempo real',
          clientMessageId: 'e2e-subscription-1',
        },
      },
      token,
    );
    const messageId = sent.body.data.sendMessage.id as string;
    const client = createClient({
      url: context.wsUrl,
      webSocketImpl: WebSocket,
      connectionParams: { authorization: `Bearer ${token}` },
      retryAttempts: 0,
    });

    try {
      const iterator = client.iterate<{ messageReceived: { id: string; body: string } }>({
        query: 'subscription { messageReceived { id body direction status } }',
      });
      const pending = iterator.next();
      const redis = new Redis(redisUrl());

      await wait(400);
      await redis.publish(
        MESSAGE_RECEIVED_CHANNEL,
        JSON.stringify({
          messageReceived: {
            messageId,
            conversationId: SELLER_ONE_CONVERSATION_ID,
            ownerId,
            occurredAt: new Date().toISOString(),
          },
        }),
      );
      const event = await pending;

      expect(event.value?.data?.messageReceived).toMatchObject({
        id: messageId,
        body: 'Evento em tempo real',
      });

      const filtered = client.iterate<{ messageReceived: { id: string } }>({
        query:
          'subscription($conversationId: ID) { messageReceived(conversationId: $conversationId) { id } }',
        variables: { conversationId: 'abababab-abab-4bab-8bab-abababababa2' },
      });
      const filteredPending = filtered.next().then(
        () => 'event',
        () => 'error',
      );

      await wait(300);
      await redis.publish(
        MESSAGE_RECEIVED_CHANNEL,
        JSON.stringify({
          messageReceived: {
            messageId,
            conversationId: SELLER_ONE_CONVERSATION_ID,
            ownerId,
            occurredAt: new Date().toISOString(),
          },
        }),
      );

      const outcome = await Promise.race([filteredPending, wait(800).then(() => 'timeout')]);

      expect(outcome).toBe('timeout');

      const otherOwner = client.iterate<{ messageReceived: { id: string } }>({
        query: 'subscription { messageReceived { id } }',
      });
      const otherOwnerPending = otherOwner.next().then(
        () => 'event',
        () => 'error',
      );

      await wait(300);
      await redis.publish(
        MESSAGE_RECEIVED_CHANNEL,
        JSON.stringify({
          messageReceived: {
            messageId,
            conversationId: SELLER_ONE_CONVERSATION_ID,
            ownerId: '99999999-9999-4999-8999-999999999999',
            occurredAt: new Date().toISOString(),
          },
        }),
      );

      const otherOutcome = await Promise.race([otherOwnerPending, wait(800).then(() => 'timeout')]);

      expect(otherOutcome).toBe('timeout');

      await otherOwner.return?.();
      await filtered.return?.();
      await redis.quit();
    } finally {
      await client.dispose();
    }
  });

  it('exporta e exclui dados do contato preservando negócios', async () => {
    const seller = await login(SELLER_ONE_EMAIL);
    const sellerTwo = await login(SELLER_TWO_EMAIL);
    const seededExport = await gql(
      'mutation($id: ID!) { exportContactData(id: $id) { contact { id } conversations { conversation { id } messages { id } } } }',
      { id: GLOBEX_CONTACT_ONE_ID },
      seller,
    );

    expect(seededExport.body.errors).toBeUndefined();
    expect(seededExport.body.data.exportContactData.conversations.length).toBeGreaterThanOrEqual(1);
    expect(
      seededExport.body.data.exportContactData.conversations[0].messages.length,
    ).toBeGreaterThanOrEqual(1);

    const email = `lgpd-${Date.now()}@example.com`;
    const created = await gql(
      'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
      { input: { firstName: 'Titular', lastName: 'LGPD', email, phone: '+55 11 98888-7777' } },
      seller,
    );
    const contactId = created.body.data.createContact.id as string;

    const duplicatePhone = await gql(
      'mutation($input: CreateContactInput!) { createContact(input: $input) { id } }',
      { input: { firstName: 'Outro', lastName: 'Contato', phone: '5511988887777' } },
      seller,
    );

    expect(duplicatePhone.body.errors?.[0]?.message).toMatch(/telefone já cadastrado/i);

    const deal = await gql(
      'mutation($input: CreateDealInput!) { createDeal(input: $input) { id contactId } }',
      { input: { title: 'Negócio LGPD', valueCents: 1000, contactId } },
      seller,
    );

    expect(deal.body.errors).toBeUndefined();

    const exported = await gql(
      'mutation($id: ID!) { exportContactData(id: $id) { exportedAt contact { id email phone } deals { id contactId } activities { id } conversations { conversation { id } messages { id } } } }',
      { id: contactId },
      seller,
    );

    expect(exported.body.errors).toBeUndefined();
    expect(exported.body.data.exportContactData.contact).toMatchObject({ id: contactId, email });
    expect(
      exported.body.data.exportContactData.deals.some(
        (item: { id: string }) => item.id === deal.body.data.createDeal.id,
      ),
    ).toBe(true);

    const forbidden = await gql(
      'mutation($id: ID!) { exportContactData(id: $id) { contact { id } } }',
      { id: contactId },
      sellerTwo,
    );

    expect(forbidden.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const deleted = await gql(
      'mutation($id: ID!) { deleteContact(id: $id) }',
      { id: contactId },
      seller,
    );

    expect(deleted.body.errors).toBeUndefined();
    expect(deleted.body.data.deleteContact).toBe(true);

    const gone = await gql(
      'query($id: ID!) { contact(id: $id) { id } }',
      { id: contactId },
      seller,
    );

    expect(gone.body.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');

    const preservedDeal = await gql(
      'query($id: ID!) { deal(id: $id) { id contactId } }',
      { id: deal.body.data.createDeal.id },
      seller,
    );

    expect(preservedDeal.body.errors).toBeUndefined();
    expect(preservedDeal.body.data.deal.contactId).toBeNull();
  });
});
