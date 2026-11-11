import { Inject, Injectable } from '@nestjs/common';
import {
  MESSAGE_RECEIVED_CHANNEL,
  normalizePhone,
  type MessageReceivedEvent,
  type WhatsAppInboundEvent,
} from '@nexo/shared';
import type { Conversation, Message, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisEventPublisher } from '../redis/redis-event.publisher.js';

export class UnprocessableEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableEventError';
  }
}

export interface ProcessResult {
  messageId: string;
  conversationId: string;
  duplicate: boolean;
}

@Injectable()
export class WhatsAppInboundProcessor {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisEventPublisher) private readonly events: RedisEventPublisher,
  ) {}

  async process(event: WhatsAppInboundEvent): Promise<ProcessResult> {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId: event.accountPhoneNumberId },
    });

    if (!account) {
      throw new UnprocessableEventError('Conta de WhatsApp desconhecida');
    }

    const phoneNormalized = normalizePhone(event.from);

    if (phoneNormalized.length === 0) {
      throw new UnprocessableEventError('Remetente sem telefone válido');
    }

    const sentAt = new Date(event.timestamp);

    try {
      const message = await this.prisma.$transaction(async (tx) => {
        const contact = await tx.contact.upsert({
          where: {
            ownerId_phoneNormalized: {
              ownerId: account.ownerId,
              phoneNormalized,
            },
          },
          create: {
            firstName: firstNameOf(event.profileName),
            lastName: lastNameOf(event.profileName),
            email: null,
            phone: event.from,
            phoneNormalized,
            ownerId: account.ownerId,
          },
          update: {},
        });

        const conversation = await tx.conversation.upsert({
          where: {
            contactId_channel: {
              contactId: contact.id,
              channel: 'WHATSAPP',
            },
          },
          create: {
            channel: 'WHATSAPP',
            contactId: contact.id,
            accountId: account.id,
            ownerId: account.ownerId,
            lastMessageAt: sentAt,
          },
          update: { accountId: account.id },
        });

        const created = await tx.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'INBOUND',
            status: 'RECEIVED',
            body: event.text,
            externalId: event.externalId,
            sentAt,
          },
        });

        await tx.conversation.updateMany({
          where: { id: conversation.id, lastMessageAt: { lt: sentAt } },
          data: { lastMessageAt: sentAt },
        });

        return { message: created, conversation, ownerId: account.ownerId };
      });

      await this.publish(message.message, message.conversation, message.ownerId);

      return {
        messageId: message.message.id,
        conversationId: message.conversation.id,
        duplicate: false,
      };
    } catch (error) {
      if (isUniqueConstraint(error)) {
        const existing = await this.prisma.message.findUnique({
          where: { externalId: event.externalId },
        });

        if (existing) {
          return {
            messageId: existing.id,
            conversationId: existing.conversationId,
            duplicate: true,
          };
        }
      }

      throw error;
    }
  }

  private async publish(
    message: Message,
    conversation: Conversation,
    ownerId: string,
  ): Promise<void> {
    const payload: MessageReceivedEvent = {
      messageReceived: {
        messageId: message.id,
        conversationId: conversation.id,
        ownerId,
        occurredAt: new Date().toISOString(),
      },
    };

    await this.events.publish(MESSAGE_RECEIVED_CHANNEL, payload);
  }
}

function firstNameOf(profileName: string | undefined): string {
  const name = profileName?.trim();

  return name ? (name.split(/\s+/)[0] ?? 'Contato') : 'Contato';
}

function lastNameOf(profileName: string | undefined): string {
  const name = profileName?.trim();

  if (!name) {
    return 'WhatsApp';
  }

  const parts = name.split(/\s+/).slice(1);

  return parts.length > 0 ? parts.join(' ') : 'WhatsApp';
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
  );
}
