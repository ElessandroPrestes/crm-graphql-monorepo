import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import {
  decodeCursor,
  pageSize,
  toConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import { Prisma, type Deal, type DealStage } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealEventsService } from '../realtime/deal-events.service.js';
import type { CreateDealInput, UpdateDealInput } from './deal.input.js';

const CLOSED_STAGES: readonly DealStage[] = ['WON', 'LOST'];

function isClosed(stage: DealStage): boolean {
  return CLOSED_STAGES.includes(stage);
}

@Injectable()
export class DealsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DealEventsService) private readonly events: DealEventsService,
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  async list(user: AuthenticatedUser, args: PaginationArgs): Promise<Connection<Deal>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeCursor(args.after) : null;
    const where: Prisma.DealWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };

    if (cursor) {
      const createdAt = new Date(cursor.createdAt);

      where.OR = [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: cursor.id } }];
    }

    const rows = await this.prisma.deal.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toConnection(rows, size);
  }

  async findById(user: AuthenticatedUser, id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });

    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }

    return deal;
  }

  async create(user: AuthenticatedUser, input: CreateDealInput): Promise<Deal> {
    const stage = input.stage ?? 'LEAD';
    const contactId = await this.resolveContactId(user, input.contactId);
    const companyId = await this.resolveCompanyId(user, input.companyId);
    const deal = await this.prisma.deal.create({
      data: {
        title: input.title.trim(),
        valueCents: input.valueCents ?? 0,
        stage,
        expectedCloseDate: input.expectedCloseDate ?? null,
        closedAt: isClosed(stage) ? new Date() : null,
        contactId,
        companyId,
        ownerId: user.id,
      },
    });

    await this.dashboard.invalidateFor(user);

    return deal;
  }

  async update(user: AuthenticatedUser, id: string, input: UpdateDealInput): Promise<Deal> {
    const existing = await this.findById(user, id);

    if (isClosed(existing.stage) && input.stage !== undefined && input.stage !== existing.stage) {
      throw new BadRequestException('Negócio encerrado não pode ser movido');
    }

    const data: Prisma.DealUncheckedUpdateManyInput = {};
    let hasChanges = false;

    if (input.title !== undefined) {
      data.title = input.title.trim();
      hasChanges = true;
    }

    if (input.valueCents !== undefined) {
      data.valueCents = input.valueCents;
      hasChanges = true;
    }

    if (input.expectedCloseDate !== undefined) {
      data.expectedCloseDate = input.expectedCloseDate;
      hasChanges = true;
    }

    if (input.contactId !== undefined) {
      data.contactId = await this.resolveContactId(user, input.contactId);
      hasChanges = true;
    }

    if (input.companyId !== undefined) {
      data.companyId = await this.resolveCompanyId(user, input.companyId);
      hasChanges = true;
    }

    if (input.stage !== undefined && input.stage !== existing.stage) {
      data.stage = input.stage;
      data.closedAt = isClosed(input.stage) ? new Date() : null;
      hasChanges = true;
    }

    if (!hasChanges) {
      return existing;
    }

    data.version = { increment: 1 };

    const result = await this.prisma.deal.updateMany({
      where: {
        id,
        version: input.expectedVersion,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
      data,
    });

    if (result.count === 0) {
      throw new ConflictException('Versão do negócio desatualizada');
    }

    const updated = await this.findById(user, id);

    if (updated.stage !== existing.stage) {
      await this.events.publishDealMoved(updated);
    }

    await this.dashboard.invalidateFor(user);

    return updated;
  }

  async delete(user: AuthenticatedUser, id: string): Promise<void> {
    await this.findById(user, id);
    await this.prisma.deal.delete({ where: { id } });
    await this.dashboard.invalidateFor(user);
  }

  private async resolveContactId(
    user: AuthenticatedUser,
    contactId: string | null | undefined,
  ): Promise<string | null> {
    if (contactId === undefined || contactId === null) {
      return null;
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

    return contact.id;
  }

  private async resolveCompanyId(
    user: AuthenticatedUser,
    companyId: string | null | undefined,
  ): Promise<string | null> {
    if (companyId === undefined || companyId === null) {
      return null;
    }

    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company.id;
  }
}
