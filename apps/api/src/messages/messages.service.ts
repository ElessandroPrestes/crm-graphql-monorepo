import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { normalizePhone } from '@nexo/shared';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  decodeTimestampCursor,
  pageSize,
  toTimestampConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import type { Message, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SendMessageInput } from './message.input.js';
import {
  WHATSAPP_PROVIDER_TOKEN,
  WhatsAppProviderError,
  type WhatsAppProvider,
} from '../whatsapp/whatsapp-provider.js';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConversationsService) private readonly conversations: ConversationsService,
    @Inject(WHATSAPP_PROVIDER_TOKEN) private readonly provider: WhatsAppProvider,
  ) {}

  async list(
    user: AuthenticatedUser,
    conversationId: string,
    args: PaginationArgs,
  ): Promise<Connection<Message>> {
    const conversation = await this.conversations.findById(user, conversationId);
    const size = pageSize(args.first);
    const cursor = args.after ? decodeTimestampCursor(args.after) : null;
    const where: Prisma.MessageWhereInput = { conversationId: conversation.id };

    if (cursor) {
      const sentAt = new Date(cursor.timestamp);

      where.OR = [{ sentAt: { lt: sentAt } }, { sentAt, id: { lt: cursor.id } }];
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toTimestampConnection(rows, size, (row) => row.sentAt);
  }

  async findById(user: AuthenticatedUser, id: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { conversation: { ownerId: user.id } }),
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    return message;
  }

  async send(user: AuthenticatedUser, input: SendMessageInput): Promise<Message> {
    const conversation = await this.conversations.findForSend(user, input.conversationId);
    const text = input.text.trim();

    if (text.length === 0) {
      throw new BadRequestException('Texto da mensagem não pode ser vazio');
    }

    if (input.clientMessageId) {
      const existing = await this.prisma.message.findUnique({
        where: {
          conversationId_clientMessageId: {
            conversationId: conversation.id,
            clientMessageId: input.clientMessageId,
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    const to =
      conversation.contact.phoneNormalized ?? normalizePhone(conversation.contact.phone ?? '');

    if (!to) {
      throw new BadRequestException('Contato sem telefone para envio');
    }

    const now = new Date();
    let message: Message;

    try {
      message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          status: 'QUEUED',
          body: text,
          clientMessageId: input.clientMessageId ?? null,
          sentAt: now,
        },
      });
    } catch (error) {
      if (input.clientMessageId && isUniqueConstraint(error)) {
        const existing = await this.prisma.message.findUnique({
          where: {
            conversationId_clientMessageId: {
              conversationId: conversation.id,
              clientMessageId: input.clientMessageId,
            },
          },
        });

        if (existing) {
          return existing;
        }
      }

      throw error;
    }

    try {
      const result = await this.provider.sendText({
        phoneNumberId: conversation.account.phoneNumberId,
        to,
        text,
      });

      const [sent] = await this.prisma.$transaction([
        this.prisma.message.update({
          where: { id: message.id },
          data: { status: 'SENT', externalId: result.externalId },
        }),
        this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: now },
        }),
      ]);

      return sent;
    } catch (error) {
      await this.prisma.message
        .update({
          where: { id: message.id },
          data: { status: 'FAILED', errorCode: 'PROVIDER_ERROR' },
        })
        .catch(() => undefined);

      if (error instanceof WhatsAppProviderError) {
        this.logger.warn(`Falha ao enviar mensagem ${message.id}: ${error.message}`);
      } else {
        this.logger.warn(`Falha inesperada ao enviar mensagem ${message.id}`);
      }

      throw new BadGatewayException('Falha ao enviar mensagem');
    }
  }
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}
