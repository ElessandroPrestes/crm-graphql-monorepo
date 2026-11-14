import 'dotenv/config';
import type { DealStage } from '../src/generated/prisma/client.js';
import { createPrismaClient } from '../src/prisma/client.js';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://nexo:nexo@localhost:5402/nexo?schema=public';
const rows = Number(process.env.BENCHMARK_ROWS ?? 120);
const stages: DealStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

function id(prefix: string, index: number): string {
  return `${prefix}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

async function main(): Promise<void> {
  if (!Number.isInteger(rows) || rows < 1 || rows > 1000) {
    throw new Error('BENCHMARK_ROWS deve ser um inteiro entre 1 e 1000');
  }

  const prisma = createPrismaClient(databaseUrl);

  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@nexo.local' } });

    if (!admin) {
      throw new Error('Execute pnpm --filter @nexo/api db:seed antes do seed de benchmark');
    }

    const base = Date.UTC(2026, 0, 1);

    for (let index = 1; index <= rows; index += 1) {
      const companyId = id('aaaaaaaa', index);
      const contactId = id('bbbbbbbb', index);
      const dealId = id('cccccccc', index);
      const createdAt = new Date(base + index * 60_000);

      await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: {
          id: companyId,
          name: `Benchmark Company ${index}`,
          domain: `bench-${index}.nexo.local`,
          industry: 'Benchmark',
          ownerId: admin.id,
          createdAt,
        },
      });

      await prisma.contact.upsert({
        where: { id: contactId },
        update: {},
        create: {
          id: contactId,
          firstName: `Benchmark${index}`,
          lastName: 'Contato',
          email: `bench-${index}@nexo.local`,
          phone: `+551198${String(index).padStart(7, '0')}`,
          phoneNormalized: `551198${String(index).padStart(7, '0')}`,
          jobTitle: 'Contato de benchmark',
          companyId,
          ownerId: admin.id,
          createdAt,
        },
      });

      await prisma.deal.upsert({
        where: { id: dealId },
        update: {},
        create: {
          id: dealId,
          title: `Benchmark Deal ${index}`,
          valueCents: 100_000 + index,
          stage: stages[index % stages.length] ?? 'LEAD',
          contactId,
          companyId,
          ownerId: admin.id,
          createdAt,
        },
      });
    }

    console.log(`${rows} negócios de benchmark garantidos para ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
