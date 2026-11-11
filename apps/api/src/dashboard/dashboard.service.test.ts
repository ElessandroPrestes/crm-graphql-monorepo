import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RedisService } from '../redis/redis.service.js';
import { DashboardService } from './dashboard.service.js';

const seller: AuthenticatedUser = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Vera Vendas',
  email: 'vendedor1@nexo.local',
  role: 'SELLER',
  createdAt: new Date('2026-11-09T12:00:00.000Z'),
};

function createService(options: {
  groupBy: ReturnType<typeof vi.fn>;
  redis: Partial<Record<keyof RedisService, ReturnType<typeof vi.fn>>>;
}): DashboardService {
  const prisma = { deal: { groupBy: options.groupBy } } as unknown as PrismaService;
  const redis = options.redis as unknown as RedisService;

  return new DashboardService(prisma, redis);
}

describe('DashboardService', () => {
  it('calcula sem cache quando o Redis está indisponível', async () => {
    const groupBy = vi.fn().mockResolvedValue([]);
    const service = createService({
      groupBy,
      redis: {
        get: vi.fn().mockRejectedValue(new Error('redis down')),
        getJson: vi.fn(),
        setJson: vi.fn().mockRejectedValue(new Error('redis down')),
        increment: vi.fn().mockRejectedValue(new Error('redis down')),
      },
    });

    const metrics = await service.metrics(seller, {});

    expect(metrics.openDeals).toBe(0);
    expect(metrics.stages).toHaveLength(6);
    expect(groupBy).toHaveBeenCalledTimes(3);
    await expect(service.invalidateFor(seller)).resolves.toBeUndefined();
  });

  it('reaproveita o cache e reviva a data de geração', async () => {
    const groupBy = vi.fn();
    const service = createService({
      groupBy,
      redis: {
        get: vi.fn().mockResolvedValue('7'),
        getJson: vi.fn().mockResolvedValue({
          openDeals: 2,
          openValueCents: 300,
          wonDeals: 1,
          wonValueCents: 400,
          lostDeals: 0,
          lostValueCents: 0,
          stages: [],
          generatedAt: '2026-11-11T10:00:00.000Z',
        }),
        setJson: vi.fn(),
        increment: vi.fn(),
      },
    });

    const metrics = await service.metrics(seller, {});

    expect(groupBy).not.toHaveBeenCalled();
    expect(metrics.openDeals).toBe(2);
    expect(metrics.generatedAt).toBeInstanceOf(Date);
    expect(metrics.generatedAt.toISOString()).toBe('2026-11-11T10:00:00.000Z');
  });

  it('invalida o cache incrementando a versão do escopo', async () => {
    const increment = vi.fn().mockResolvedValue(2);
    const service = createService({
      groupBy: vi.fn(),
      redis: {
        get: vi.fn(),
        getJson: vi.fn(),
        setJson: vi.fn(),
        increment,
      },
    });

    await service.invalidateFor(seller);

    expect(increment).toHaveBeenCalledWith(`dashboard:version:seller:${seller.id}`);
  });

  it('rejeita período invertido', async () => {
    const service = createService({
      groupBy: vi.fn(),
      redis: {
        get: vi.fn(),
        getJson: vi.fn(),
        setJson: vi.fn(),
        increment: vi.fn(),
      },
    });

    await expect(
      service.metrics(seller, {
        periodStart: new Date('2026-11-12T00:00:00.000Z'),
        periodEnd: new Date('2026-11-11T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
