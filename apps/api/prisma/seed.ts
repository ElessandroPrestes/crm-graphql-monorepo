import 'dotenv/config';
import argon2 from 'argon2';
import { assertPasswordPolicy } from '../src/auth/password-policy.js';
import { createPrismaClient } from '../src/prisma/client.js';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://nexo:nexo@localhost:5402/nexo?schema=public';

const password = assertPasswordPolicy('NexoDemo!2026');

const ids = {
  admin: '11111111-1111-4111-8111-111111111111',
  sellerOne: '22222222-2222-4222-8222-222222222222',
  sellerTwo: '33333333-3333-4333-8333-333333333333',
  acme: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  globex: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  initech: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  acmeContactOne: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  acmeContactTwo: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  globexContactOne: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  globexContactTwo: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
  initechContactOne: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
  adminDealLead: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  sellerOneDealProposal: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
  sellerOneDealWon: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  sellerTwoDealNegotiation: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
  sellerTwoDealLead: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
  adminActivityNote: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  sellerOneActivityCall: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  sellerOneActivityMeeting: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
  sellerTwoActivityEmail: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
  sellerTwoActivityCall: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd5',
  sellerOneAccount: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  sellerTwoAccount: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  sellerOneConversation: 'abababab-abab-4bab-8bab-abababababa1',
  sellerTwoConversation: 'abababab-abab-4bab-8bab-abababababa2',
  sellerOneMessageInbound: 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1',
  sellerOneMessageOutbound: 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2',
  sellerTwoMessageInbound: 'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3',
} as const;

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

async function main(): Promise<void> {
  const prisma = createPrismaClient(databaseUrl);

  try {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const admin = await prisma.user.upsert({
      where: { id: ids.admin },
      update: {
        name: 'Ana Admin',
        email: 'admin@nexo.local',
        role: 'ADMIN',
        passwordHash,
      },
      create: {
        id: ids.admin,
        name: 'Ana Admin',
        email: 'admin@nexo.local',
        role: 'ADMIN',
        passwordHash,
      },
    });

    const sellerOne = await prisma.user.upsert({
      where: { id: ids.sellerOne },
      update: {
        name: 'Vera Vendas',
        email: 'vendedor1@nexo.local',
        role: 'SELLER',
        passwordHash,
      },
      create: {
        id: ids.sellerOne,
        name: 'Vera Vendas',
        email: 'vendedor1@nexo.local',
        role: 'SELLER',
        passwordHash,
      },
    });

    const sellerTwo = await prisma.user.upsert({
      where: { id: ids.sellerTwo },
      update: {
        name: 'Vitor Vendas',
        email: 'vendedor2@nexo.local',
        role: 'SELLER',
        passwordHash,
      },
      create: {
        id: ids.sellerTwo,
        name: 'Vitor Vendas',
        email: 'vendedor2@nexo.local',
        role: 'SELLER',
        passwordHash,
      },
    });

    const acme = await prisma.company.upsert({
      where: { id: ids.acme },
      update: {
        name: 'Acme Demonstração',
        domain: 'acme.example.com',
        industry: 'Tecnologia',
        ownerId: admin.id,
      },
      create: {
        id: ids.acme,
        name: 'Acme Demonstração',
        domain: 'acme.example.com',
        industry: 'Tecnologia',
        ownerId: admin.id,
      },
    });

    const globex = await prisma.company.upsert({
      where: { id: ids.globex },
      update: {
        name: 'Globex Demonstração',
        domain: 'globex.example.com',
        industry: 'Indústria',
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.globex,
        name: 'Globex Demonstração',
        domain: 'globex.example.com',
        industry: 'Indústria',
        ownerId: sellerOne.id,
      },
    });

    const initech = await prisma.company.upsert({
      where: { id: ids.initech },
      update: {
        name: 'Initech Demonstração',
        domain: 'initech.example.com',
        industry: 'Serviços',
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.initech,
        name: 'Initech Demonstração',
        domain: 'initech.example.com',
        industry: 'Serviços',
        ownerId: sellerTwo.id,
      },
    });

    await prisma.contact.upsert({
      where: { id: ids.acmeContactOne },
      update: {
        firstName: 'Alice',
        lastName: 'Exemplo',
        email: 'alice@acme.example.com',
        phone: '+55 11 90000-0001',
        phoneNormalized: normalizePhone('+55 11 90000-0001'),
        jobTitle: 'Diretora de Compras',
        companyId: acme.id,
        ownerId: admin.id,
      },
      create: {
        id: ids.acmeContactOne,
        firstName: 'Alice',
        lastName: 'Exemplo',
        email: 'alice@acme.example.com',
        phone: '+55 11 90000-0001',
        phoneNormalized: normalizePhone('+55 11 90000-0001'),
        jobTitle: 'Diretora de Compras',
        companyId: acme.id,
        ownerId: admin.id,
      },
    });

    await prisma.contact.upsert({
      where: { id: ids.acmeContactTwo },
      update: {
        firstName: 'Bruno',
        lastName: 'Exemplo',
        email: 'bruno@acme.example.com',
        phone: '+55 11 90000-0002',
        phoneNormalized: normalizePhone('+55 11 90000-0002'),
        jobTitle: 'Gerente de TI',
        companyId: acme.id,
        ownerId: admin.id,
      },
      create: {
        id: ids.acmeContactTwo,
        firstName: 'Bruno',
        lastName: 'Exemplo',
        email: 'bruno@acme.example.com',
        phone: '+55 11 90000-0002',
        phoneNormalized: normalizePhone('+55 11 90000-0002'),
        jobTitle: 'Gerente de TI',
        companyId: acme.id,
        ownerId: admin.id,
      },
    });

    await prisma.contact.upsert({
      where: { id: ids.globexContactOne },
      update: {
        firstName: 'Carla',
        lastName: 'Exemplo',
        email: 'carla@globex.example.com',
        phone: '+55 11 90000-0003',
        phoneNormalized: normalizePhone('+55 11 90000-0003'),
        jobTitle: 'Head de Operações',
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.globexContactOne,
        firstName: 'Carla',
        lastName: 'Exemplo',
        email: 'carla@globex.example.com',
        phone: '+55 11 90000-0003',
        phoneNormalized: normalizePhone('+55 11 90000-0003'),
        jobTitle: 'Head de Operações',
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
    });

    await prisma.contact.upsert({
      where: { id: ids.globexContactTwo },
      update: {
        firstName: 'Diego',
        lastName: 'Exemplo',
        email: 'diego@globex.example.com',
        phone: '+55 11 90000-0004',
        phoneNormalized: normalizePhone('+55 11 90000-0004'),
        jobTitle: 'Analista de Compras',
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.globexContactTwo,
        firstName: 'Diego',
        lastName: 'Exemplo',
        email: 'diego@globex.example.com',
        phone: '+55 11 90000-0004',
        phoneNormalized: normalizePhone('+55 11 90000-0004'),
        jobTitle: 'Analista de Compras',
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
    });

    await prisma.contact.upsert({
      where: { id: ids.initechContactOne },
      update: {
        firstName: 'Elisa',
        lastName: 'Exemplo',
        email: 'elisa@initech.example.com',
        phone: '+55 11 90000-0005',
        phoneNormalized: normalizePhone('+55 11 90000-0005'),
        jobTitle: 'COO',
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.initechContactOne,
        firstName: 'Elisa',
        lastName: 'Exemplo',
        email: 'elisa@initech.example.com',
        phone: '+55 11 90000-0005',
        phoneNormalized: normalizePhone('+55 11 90000-0005'),
        jobTitle: 'COO',
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
    });

    await prisma.deal.upsert({
      where: { id: ids.adminDealLead },
      update: {
        title: 'Renovação Acme',
        valueCents: 4500000,
        stage: 'LEAD',
        version: 1,
        expectedCloseDate: new Date('2026-12-15T00:00:00.000Z'),
        contactId: ids.acmeContactOne,
        companyId: acme.id,
        ownerId: admin.id,
      },
      create: {
        id: ids.adminDealLead,
        title: 'Renovação Acme',
        valueCents: 4500000,
        stage: 'LEAD',
        version: 1,
        expectedCloseDate: new Date('2026-12-15T00:00:00.000Z'),
        contactId: ids.acmeContactOne,
        companyId: acme.id,
        ownerId: admin.id,
      },
    });

    await prisma.deal.upsert({
      where: { id: ids.sellerOneDealProposal },
      update: {
        title: 'Implantação Globex',
        valueCents: 12000000,
        stage: 'PROPOSAL',
        version: 2,
        expectedCloseDate: new Date('2026-12-20T00:00:00.000Z'),
        contactId: ids.globexContactOne,
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.sellerOneDealProposal,
        title: 'Implantação Globex',
        valueCents: 12000000,
        stage: 'PROPOSAL',
        version: 2,
        expectedCloseDate: new Date('2026-12-20T00:00:00.000Z'),
        contactId: ids.globexContactOne,
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
    });

    await prisma.deal.upsert({
      where: { id: ids.sellerOneDealWon },
      update: {
        title: 'Consultoria Globex',
        valueCents: 3800000,
        stage: 'WON',
        version: 3,
        closedAt: new Date('2026-11-05T00:00:00.000Z'),
        contactId: ids.globexContactTwo,
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.sellerOneDealWon,
        title: 'Consultoria Globex',
        valueCents: 3800000,
        stage: 'WON',
        version: 3,
        closedAt: new Date('2026-11-05T00:00:00.000Z'),
        contactId: ids.globexContactTwo,
        companyId: globex.id,
        ownerId: sellerOne.id,
      },
    });

    await prisma.deal.upsert({
      where: { id: ids.sellerTwoDealNegotiation },
      update: {
        title: 'Licenças Initech',
        valueCents: 7600000,
        stage: 'NEGOTIATION',
        version: 2,
        expectedCloseDate: new Date('2026-12-10T00:00:00.000Z'),
        contactId: ids.initechContactOne,
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.sellerTwoDealNegotiation,
        title: 'Licenças Initech',
        valueCents: 7600000,
        stage: 'NEGOTIATION',
        version: 2,
        expectedCloseDate: new Date('2026-12-10T00:00:00.000Z'),
        contactId: ids.initechContactOne,
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
    });

    await prisma.deal.upsert({
      where: { id: ids.sellerTwoDealLead },
      update: {
        title: 'Projeto piloto Initech',
        valueCents: 2100000,
        stage: 'LEAD',
        version: 1,
        contactId: ids.initechContactOne,
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.sellerTwoDealLead,
        title: 'Projeto piloto Initech',
        valueCents: 2100000,
        stage: 'LEAD',
        version: 1,
        contactId: ids.initechContactOne,
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
    });

    await prisma.activity.upsert({
      where: { id: ids.adminActivityNote },
      update: {
        type: 'NOTE',
        subject: 'Primeiro contato com Acme',
        notes: 'Cliente demonstrou interesse na renovação.',
        occurredAt: new Date('2026-11-01T13:00:00.000Z'),
        contactId: ids.acmeContactOne,
        dealId: ids.adminDealLead,
        ownerId: admin.id,
      },
      create: {
        id: ids.adminActivityNote,
        type: 'NOTE',
        subject: 'Primeiro contato com Acme',
        notes: 'Cliente demonstrou interesse na renovação.',
        occurredAt: new Date('2026-11-01T13:00:00.000Z'),
        contactId: ids.acmeContactOne,
        dealId: ids.adminDealLead,
        ownerId: admin.id,
      },
    });

    await prisma.activity.upsert({
      where: { id: ids.sellerOneActivityCall },
      update: {
        type: 'CALL',
        subject: 'Ligação de descoberta',
        notes: 'Levantamento de requisitos iniciais.',
        occurredAt: new Date('2026-11-02T14:30:00.000Z'),
        contactId: ids.globexContactOne,
        dealId: ids.sellerOneDealProposal,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.sellerOneActivityCall,
        type: 'CALL',
        subject: 'Ligação de descoberta',
        notes: 'Levantamento de requisitos iniciais.',
        occurredAt: new Date('2026-11-02T14:30:00.000Z'),
        contactId: ids.globexContactOne,
        dealId: ids.sellerOneDealProposal,
        ownerId: sellerOne.id,
      },
    });

    await prisma.activity.upsert({
      where: { id: ids.sellerOneActivityMeeting },
      update: {
        type: 'MEETING',
        subject: 'Apresentação da proposta',
        notes: 'Proposta apresentada e aprovada verbalmente.',
        occurredAt: new Date('2026-11-04T16:00:00.000Z'),
        contactId: ids.globexContactTwo,
        dealId: ids.sellerOneDealWon,
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.sellerOneActivityMeeting,
        type: 'MEETING',
        subject: 'Apresentação da proposta',
        notes: 'Proposta apresentada e aprovada verbalmente.',
        occurredAt: new Date('2026-11-04T16:00:00.000Z'),
        contactId: ids.globexContactTwo,
        dealId: ids.sellerOneDealWon,
        ownerId: sellerOne.id,
      },
    });

    await prisma.activity.upsert({
      where: { id: ids.sellerTwoActivityEmail },
      update: {
        type: 'EMAIL',
        subject: 'Envio de condições comerciais',
        notes: 'Aguardando retorno do jurídico.',
        occurredAt: new Date('2026-11-03T10:15:00.000Z'),
        contactId: ids.initechContactOne,
        dealId: ids.sellerTwoDealNegotiation,
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.sellerTwoActivityEmail,
        type: 'EMAIL',
        subject: 'Envio de condições comerciais',
        notes: 'Aguardando retorno do jurídico.',
        occurredAt: new Date('2026-11-03T10:15:00.000Z'),
        contactId: ids.initechContactOne,
        dealId: ids.sellerTwoDealNegotiation,
        ownerId: sellerTwo.id,
      },
    });

    await prisma.activity.upsert({
      where: { id: ids.sellerTwoActivityCall },
      update: {
        type: 'CALL',
        subject: 'Follow-up comercial',
        occurredAt: new Date('2026-11-06T11:45:00.000Z'),
        contactId: ids.initechContactOne,
        dealId: ids.sellerTwoDealLead,
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.sellerTwoActivityCall,
        type: 'CALL',
        subject: 'Follow-up comercial',
        occurredAt: new Date('2026-11-06T11:45:00.000Z'),
        contactId: ids.initechContactOne,
        dealId: ids.sellerTwoDealLead,
        ownerId: sellerTwo.id,
      },
    });

    const sellerOneAccount = await prisma.whatsAppAccount.upsert({
      where: { id: ids.sellerOneAccount },
      update: {
        phoneNumberId: 'seed-phone-seller-1',
        displayPhoneNumber: '+55 11 80000-0001',
        ownerId: sellerOne.id,
      },
      create: {
        id: ids.sellerOneAccount,
        phoneNumberId: 'seed-phone-seller-1',
        displayPhoneNumber: '+55 11 80000-0001',
        ownerId: sellerOne.id,
      },
    });

    const sellerTwoAccount = await prisma.whatsAppAccount.upsert({
      where: { id: ids.sellerTwoAccount },
      update: {
        phoneNumberId: 'seed-phone-seller-2',
        displayPhoneNumber: '+55 11 80000-0002',
        ownerId: sellerTwo.id,
      },
      create: {
        id: ids.sellerTwoAccount,
        phoneNumberId: 'seed-phone-seller-2',
        displayPhoneNumber: '+55 11 80000-0002',
        ownerId: sellerTwo.id,
      },
    });

    await prisma.conversation.upsert({
      where: { id: ids.sellerOneConversation },
      update: {
        channel: 'WHATSAPP',
        contactId: ids.globexContactOne,
        accountId: sellerOneAccount.id,
        ownerId: sellerOne.id,
        lastMessageAt: new Date('2026-11-10T14:30:00.000Z'),
      },
      create: {
        id: ids.sellerOneConversation,
        channel: 'WHATSAPP',
        contactId: ids.globexContactOne,
        accountId: sellerOneAccount.id,
        ownerId: sellerOne.id,
        lastMessageAt: new Date('2026-11-10T14:30:00.000Z'),
      },
    });

    await prisma.conversation.upsert({
      where: { id: ids.sellerTwoConversation },
      update: {
        channel: 'WHATSAPP',
        contactId: ids.initechContactOne,
        accountId: sellerTwoAccount.id,
        ownerId: sellerTwo.id,
        lastMessageAt: new Date('2026-11-10T15:00:00.000Z'),
      },
      create: {
        id: ids.sellerTwoConversation,
        channel: 'WHATSAPP',
        contactId: ids.initechContactOne,
        accountId: sellerTwoAccount.id,
        ownerId: sellerTwo.id,
        lastMessageAt: new Date('2026-11-10T15:00:00.000Z'),
      },
    });

    await prisma.message.upsert({
      where: { id: ids.sellerOneMessageInbound },
      update: {
        conversationId: ids.sellerOneConversation,
        direction: 'INBOUND',
        status: 'RECEIVED',
        body: 'Olá, poderia enviar a proposta revisada?',
        externalId: 'wamid.seed.seller1.inbound.1',
        sentAt: new Date('2026-11-10T14:25:00.000Z'),
      },
      create: {
        id: ids.sellerOneMessageInbound,
        conversationId: ids.sellerOneConversation,
        direction: 'INBOUND',
        status: 'RECEIVED',
        body: 'Olá, poderia enviar a proposta revisada?',
        externalId: 'wamid.seed.seller1.inbound.1',
        sentAt: new Date('2026-11-10T14:25:00.000Z'),
      },
    });

    await prisma.message.upsert({
      where: { id: ids.sellerOneMessageOutbound },
      update: {
        conversationId: ids.sellerOneConversation,
        direction: 'OUTBOUND',
        status: 'SENT',
        body: 'Claro, envio ainda hoje.',
        externalId: 'wamid.seed.seller1.outbound.1',
        clientMessageId: 'seed-outbound-1',
        sentAt: new Date('2026-11-10T14:30:00.000Z'),
      },
      create: {
        id: ids.sellerOneMessageOutbound,
        conversationId: ids.sellerOneConversation,
        direction: 'OUTBOUND',
        status: 'SENT',
        body: 'Claro, envio ainda hoje.',
        externalId: 'wamid.seed.seller1.outbound.1',
        clientMessageId: 'seed-outbound-1',
        sentAt: new Date('2026-11-10T14:30:00.000Z'),
      },
    });

    await prisma.message.upsert({
      where: { id: ids.sellerTwoMessageInbound },
      update: {
        conversationId: ids.sellerTwoConversation,
        direction: 'INBOUND',
        status: 'RECEIVED',
        body: 'Podemos revisar o contrato amanhã?',
        externalId: 'wamid.seed.seller2.inbound.1',
        sentAt: new Date('2026-11-10T15:00:00.000Z'),
      },
      create: {
        id: ids.sellerTwoMessageInbound,
        conversationId: ids.sellerTwoConversation,
        direction: 'INBOUND',
        status: 'RECEIVED',
        body: 'Podemos revisar o contrato amanhã?',
        externalId: 'wamid.seed.seller2.inbound.1',
        sentAt: new Date('2026-11-10T15:00:00.000Z'),
      },
    });

    console.log('Seed da Fase 3 concluído com dados fictícios.');
    console.log('Credenciais de desenvolvimento: admin@nexo.local / NexoDemo!2026');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Falha ao executar o seed:', error);
  process.exitCode = 1;
});
