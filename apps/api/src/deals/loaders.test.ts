import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Contact, Deal } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { createContactLoader } from './contact.loader.js';
import { createDealLoader } from './deal.loader.js';

const seller: AuthenticatedUser = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Vera Vendas',
  email: 'vendedor1@nexo.local',
  role: 'SELLER',
  createdAt: new Date('2026-11-09T12:00:00.000Z'),
};

function contact(id: string, ownerId: string): Contact {
  return {
    id,
    firstName: 'Contato',
    lastName: 'Exemplo',
    email: `${id}@example.com`,
    phone: null,
    jobTitle: null,
    companyId: null,
    ownerId,
    createdAt: new Date('2026-11-09T12:00:00.000Z'),
    updatedAt: new Date('2026-11-09T12:00:00.000Z'),
  };
}

function deal(id: string, ownerId: string): Deal {
  return {
    id,
    title: 'Negócio',
    valueCents: 1000,
    stage: 'LEAD',
    version: 1,
    expectedCloseDate: null,
    closedAt: null,
    contactId: null,
    companyId: null,
    ownerId,
    createdAt: new Date('2026-11-09T12:00:00.000Z'),
    updatedAt: new Date('2026-11-09T12:00:00.000Z'),
  };
}

describe('DataLoaders do funil', () => {
  it('batches contact lookups and preserves the requested order', async () => {
    const first = contact('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', seller.id);
    const second = contact('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', seller.id);
    const findMany = vi.fn().mockResolvedValue([second, first]);
    const prisma = { contact: { findMany } } as unknown as PrismaService;
    const loader = createContactLoader(prisma, seller);

    const result = await Promise.all([
      loader.load(first.id),
      loader.load(second.id),
      loader.load('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9'),
    ]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: { in: [first.id, second.id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9'] },
        ownerId: seller.id,
      },
    });
    expect(result).toEqual([first, second, null]);
  });

  it('batches deal lookups and preserves the requested order', async () => {
    const first = deal('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', seller.id);
    const second = deal('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', seller.id);
    const findMany = vi.fn().mockResolvedValue([first, second]);
    const prisma = { deal: { findMany } } as unknown as PrismaService;
    const loader = createDealLoader(prisma, seller);

    const result = await Promise.all([loader.load(first.id), loader.load(second.id)]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: [first.id, second.id] }, ownerId: seller.id },
    });
    expect(result).toEqual([first, second]);
  });
});
