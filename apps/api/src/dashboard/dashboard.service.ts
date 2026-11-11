import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { Prisma, type DealStage } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

export const DASHBOARD_CACHE_TTL_SECONDS = 30;
export const OPEN_STAGES: readonly DealStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
export const ALL_STAGES: readonly DealStage[] = [...OPEN_STAGES, 'WON', 'LOST'];

export interface StageMetric {
  stage: DealStage;
  count: number;
  valueCents: number;
}

export interface DashboardMetrics {
  openDeals: number;
  openValueCents: number;
  wonDeals: number;
  wonValueCents: number;
  lostDeals: number;
  lostValueCents: number;
  stages: StageMetric[];
  generatedAt: Date;
}

export interface DashboardPeriod {
  periodStart?: Date;
  periodEnd?: Date;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async metrics(user: AuthenticatedUser, period: DashboardPeriod): Promise<DashboardMetrics> {
    this.validatePeriod(period);

    const scope = this.scopeFor(user);
    const cached = await this.readCache(scope, period);

    if (cached) {
      return cached;
    }

    const computed = await this.compute(user, period);

    await this.writeCache(scope, period, computed);

    return computed;
  }

  async invalidateFor(user: AuthenticatedUser): Promise<void> {
    try {
      await this.redis.increment(this.versionKey(this.scopeFor(user)));
    } catch {
      this.logger.warn('Falha ao invalidar o cache do dashboard');
    }
  }

  private async compute(
    user: AuthenticatedUser,
    period: DashboardPeriod,
  ): Promise<DashboardMetrics> {
    const ownerWhere: Prisma.DealWhereInput = user.role === 'ADMIN' ? {} : { ownerId: user.id };
    const closedRange: Prisma.DealWhereInput =
      period.periodStart || period.periodEnd
        ? {
            closedAt: {
              ...(period.periodStart ? { gte: period.periodStart } : {}),
              ...(period.periodEnd ? { lt: period.periodEnd } : {}),
            },
          }
        : {};
    const aggregate = {
      _count: { _all: true },
      _sum: { valueCents: true },
    } as const;

    const [openGroups, wonGroups, lostGroups] = await Promise.all([
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { ...ownerWhere, stage: { in: [...OPEN_STAGES] } },
        ...aggregate,
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { ...ownerWhere, stage: 'WON', ...closedRange },
        ...aggregate,
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { ...ownerWhere, stage: 'LOST', ...closedRange },
        ...aggregate,
      }),
    ]);

    const byStage = new Map<DealStage, StageMetric>();

    for (const group of openGroups) {
      byStage.set(group.stage, {
        stage: group.stage,
        count: group._count._all,
        valueCents: group._sum.valueCents ?? 0,
      });
    }

    for (const group of [...wonGroups, ...lostGroups]) {
      byStage.set(group.stage, {
        stage: group.stage,
        count: group._count._all,
        valueCents: group._sum.valueCents ?? 0,
      });
    }

    const stages = ALL_STAGES.map(
      (stage) => byStage.get(stage) ?? { stage, count: 0, valueCents: 0 },
    );
    const openDeals = OPEN_STAGES.reduce(
      (total, stage) => total + (byStage.get(stage)?.count ?? 0),
      0,
    );
    const openValueCents = OPEN_STAGES.reduce(
      (total, stage) => total + (byStage.get(stage)?.valueCents ?? 0),
      0,
    );

    return {
      openDeals,
      openValueCents,
      wonDeals: byStage.get('WON')?.count ?? 0,
      wonValueCents: byStage.get('WON')?.valueCents ?? 0,
      lostDeals: byStage.get('LOST')?.count ?? 0,
      lostValueCents: byStage.get('LOST')?.valueCents ?? 0,
      stages,
      generatedAt: new Date(),
    };
  }

  private async readCache(
    scope: string,
    period: DashboardPeriod,
  ): Promise<DashboardMetrics | null> {
    try {
      const version = (await this.redis.get(this.versionKey(scope))) ?? '0';
      const cached = await this.redis.getJson<DashboardMetrics>(
        this.cacheKey(scope, version, period),
      );

      return cached ? { ...cached, generatedAt: new Date(cached.generatedAt) } : null;
    } catch {
      this.logger.warn('Redis indisponível; dashboard será calculado sem cache');
      return null;
    }
  }

  private async writeCache(
    scope: string,
    period: DashboardPeriod,
    metrics: DashboardMetrics,
  ): Promise<void> {
    try {
      const version = (await this.redis.get(this.versionKey(scope))) ?? '0';

      await this.redis.setJson(
        this.cacheKey(scope, version, period),
        metrics,
        DASHBOARD_CACHE_TTL_SECONDS,
      );
    } catch {
      this.logger.warn('Redis indisponível; resultado do dashboard não foi cacheado');
    }
  }

  private validatePeriod(period: DashboardPeriod): void {
    if (
      period.periodStart &&
      period.periodEnd &&
      period.periodStart.getTime() > period.periodEnd.getTime()
    ) {
      throw new BadRequestException('periodStart não pode ser posterior a periodEnd');
    }
  }

  private scopeFor(user: AuthenticatedUser): string {
    return user.role === 'ADMIN' ? 'admin' : `seller:${user.id}`;
  }

  private versionKey(scope: string): string {
    return `dashboard:version:${scope}`;
  }

  private cacheKey(scope: string, version: string, period: DashboardPeriod): string {
    const start = period.periodStart?.toISOString() ?? 'all';
    const end = period.periodEnd?.toISOString() ?? 'all';

    return `dashboard:metrics:${scope}:${version}:${start}:${end}`;
  }
}
