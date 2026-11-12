import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { AuthenticatedUser, GqlContext } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import { ContactType } from '../contacts/contact.type.js';
import { createContactLoader } from '../deals/contact.loader.js';
import type { Contact, Conversation } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationConnection } from './conversation.connection.js';
import { ConversationType } from './conversation.type.js';
import { ConversationsService } from './conversations.service.js';

@Resolver(() => ConversationType)
@UseGuards(JwtAuthGuard)
export class ConversationsResolver {
  constructor(
    @Inject(ConversationsService) private readonly conversationsService: ConversationsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Query(() => ConversationConnection)
  conversations(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('contactId', { type: () => ID, nullable: true }) contactId?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    return this.conversationsService.list(user, { first, after, contactId, search });
  }

  @Query(() => ConversationType)
  conversation(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.conversationsService.findById(user, id);
  }

  @ResolveField(() => ContactType)
  async contact(
    @Parent() conversation: Conversation,
    @Context() context: GqlContext,
  ): Promise<Contact> {
    context.contactLoader ??= createContactLoader(this.prisma, context.user);

    return context.contactLoader.load(conversation.contactId) as Promise<Contact>;
  }
}
