import 'dotenv/config';
import argon2 from 'argon2';
import { createPrismaClient } from '../src/prisma/client.js';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://nexo:nexo@localhost:5402/nexo?schema=public';

const password = 'NexoDemo!2026';

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
} as const;

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
        jobTitle: 'COO',
        companyId: initech.id,
        ownerId: sellerTwo.id,
      },
    });

    console.log('Seed da Fase 1 concluído com dados fictícios.');
    console.log('Credenciais de desenvolvimento: admin@nexo.local / NexoDemo!2026');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Falha ao executar o seed:', error);
  process.exitCode = 1;
});
