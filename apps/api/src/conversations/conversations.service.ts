import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  decodeTimestampCursor,
  pageSize,
  toTimestampConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import type { Conversation, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ConversationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, args: PaginationArgs): Promise<Connection<Conversation>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeTimestampCursor(args.after) : null;
    const where: Prisma.ConversationWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };

    if (cursor) {
      const lastMessageAt = new Date(cursor.timestamp);

      where.OR = [
        { lastMessageAt: { lt: lastMessageAt } },
        { lastMessageAt, id: { lt: cursor.id } },
      ];
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
