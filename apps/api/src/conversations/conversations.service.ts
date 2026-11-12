import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { normalizeSearch, optionalUuid } from '../common/filters.js';
import {
  decodeTimestampCursor,
  pageSize,
  toTimestampConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import type { Conversation, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ConversationListArgs extends PaginationArgs {
  contactId?: string;
  search?: string;
}

@Injectable()
export class ConversationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(
    user: AuthenticatedUser,
    args: ConversationListArgs,
  ): Promise<Connection<Conversation>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeTimestampCursor(args.after) : null;
    const contactId = optionalUuid(args.contactId, 'contactId');
    const search = normalizeSearch(args.search);
    const where: Prisma.ConversationWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };
    const filters: Prisma.ConversationWhereInput[] = [];

    if (contactId) {
      filters.push({ contactId });
    }

    if (search) {
      filters.push({
        contact: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (cursor) {
      const lastMessageAt = new Date(cursor.timestamp);

      filters.push({
        OR: [{ lastMessageAt: { lt: lastMessageAt } }, { lastMessageAt, id: { lt: cursor.id } }],
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const rows = await this.prisma.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toTimestampConnection(rows, size, (row) => row.lastMessageAt);
  }

  async findById(user: AuthenticatedUser, id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    return conversation;
  }

  async findForSend(user: AuthenticatedUser, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
      include: { contact: true, account: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    return conversation;
  }
}
