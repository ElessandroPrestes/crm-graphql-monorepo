import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  decodeTimestampCursor,
  pageSize,
  toTimestampConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { Prisma, type Activity } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateActivityInput } from './activity.input.js';

export interface ActivityListArgs extends PaginationArgs {
  contactId?: string;
  dealId?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  async list(user: AuthenticatedUser, args: ActivityListArgs): Promise<Connection<Activity>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeTimestampCursor(args.after) : null;
    const where: Prisma.ActivityWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      ...(args.contactId ? { contactId: args.contactId } : {}),
      ...(args.dealId ? { dealId: args.dealId } : {}),
    };

    if (cursor) {
      const occurredAt = new Date(cursor.timestamp);

      where.OR = [{ occurredAt: { lt: occurredAt } }, { occurredAt, id: { lt: cursor.id } }];
    }

    const rows = await this.prisma.activity.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toTimestampConnection(rows, size, (activity) => activity.occurredAt);
  }

  async create(user: AuthenticatedUser, input: CreateActivityInput): Promise<Activity> {
    const contactId = input.contactId ?? null;
    const dealId = input.dealId ?? null;

    if (!contactId && !dealId) {
      throw new BadRequestException('Atividade exige contato ou negócio');
    }

    await this.assertContact(user, contactId);
    await this.assertDeal(user, dealId);

    const activity = await this.prisma.activity.create({
      data: {
        type: input.type,
        subject: input.subject.trim(),
        notes: normalizeOptional(input.notes),
        occurredAt: input.occurredAt,
        contactId,
        dealId,
        ownerId: user.id,
      },
    });

    await this.dashboard.invalidateFor(user);

    return activity;
  }

  private async assertContact(user: AuthenticatedUser, contactId: string | null): Promise<void> {
    if (!contactId) {
      return;
    }

    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
      select: { id: true },
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }
  }

  private async assertDeal(user: AuthenticatedUser, dealId: string | null): Promise<void> {
    if (!dealId) {
      return;
    }

    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
      select: { id: true },
    });

    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }
  }
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}
