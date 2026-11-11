import { Inject, UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import type { Message } from '../generated/prisma/client.js';
import { MessageEventsService } from '../realtime/message-events.service.js';
import { MessageConnection } from './message.connection.js';
import { SendMessageInput } from './message.input.js';
import { MessageType } from './message.type.js';
import { MessagesService } from './messages.service.js';

@Resolver(() => MessageType)
@UseGuards(JwtAuthGuard)
export class MessagesResolver {
  constructor(
    @Inject(MessagesService) private readonly messagesService: MessagesService,
    @Inject(MessageEventsService) private readonly messageEvents: MessageEventsService,
  ) {}

  @Query(() => MessageConnection)
  messages(
    @CurrentUser() user: AuthenticatedUser,
    @Args('conversationId', { type: () => ID }) conversationId: string,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    return this.messagesService.list(user, conversationId, { first, after });
  }

  @Mutation(() => MessageType)
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { type: () => SendMessageInput }) input: SendMessageInput,
  ) {
    return this.messagesService.send(user, input);
  }

  @Subscription(() => MessageType)
  async *messageReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Args('conversationId', { type: () => ID, nullable: true }) conversationId?: string,
  ): AsyncIterableIterator<{ messageReceived: Message }> {
    for await (const event of this.messageEvents.createIterator()) {
      const payload = event.messageReceived;

      if (conversationId && payload.conversationId !== conversationId) {
        continue;
      }

      if (user.role !== 'ADMIN' && payload.ownerId !== user.id) {
        continue;
      }

      try {
        yield { messageReceived: await this.messagesService.findById(user, payload.messageId) };
      } catch {
        continue;
      }
    }
  }
}
