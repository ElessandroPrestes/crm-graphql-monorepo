import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Company } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { createCompanyLoader } from './company.loader.js';

const seller: AuthenticatedUser = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Vera Vendas',
  email: 'vendedor1@nexo.local',
  role: 'SELLER',
  createdAt: new Date('2026-11-09T12:00:00.000Z'),
};

const admin: AuthenticatedUser = {
  ...seller,
  id: '11111111-1111-4111-8111-111111111111',
  role: 'ADMIN',
};

function company(id: string, ownerId: string): Company {
  return {
    id,
    name: `Empresa ${id}`,
    domain: null,
    industry: null,
    ownerId,
    createdAt: new Date('2026-11-09T12:00:00.000Z'),
    updatedAt: new Date('2026-11-09T12:00:00.000Z'),
  };
}

describe('createCompanyLoader', () => {
  it('batches company lookups and preserves the requested order', async () => {
    const first = company('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', seller.id);
    const second = company('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', seller.id);
    const findMany = vi.fn().mockResolvedValue([second, first]);
    const prisma = { company: { findMany } } as unknown as PrismaService;
    const loader = createCompanyLoader(prisma, seller);

    const result = await Promise.all([
      loader.load(first.id),
      loader.load(second.id),
      loader.load('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'),
    ]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [first.id, second.id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'],
        },
        ownerId: seller.id,
      },
    });
    expect(result).toEqual([first, second, null]);
  });

  it('does not filter by owner for an admin', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { company: { findMany } } as unknown as PrismaService;
    const loader = createCompanyLoader(prisma, admin);

    await Promise.all([loader.load('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'] },
      },
    });
  });
});
