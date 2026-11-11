import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { AuthenticatedUser, GqlContext } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import { ContactType } from '../contacts/contact.type.js';
import { createContactLoader } from '../deals/contact.loader.js';
import { createDealLoader } from '../deals/deal.loader.js';
import { DealType } from '../deals/deal.type.js';
import type { Activity, Contact, Deal } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityConnection } from './activity.connection.js';
import { CreateActivityInput } from './activity.input.js';
import { ActivityType } from './activity.type.js';
import { ActivitiesService } from './activities.service.js';

@Resolver(() => ActivityType)
@UseGuards(JwtAuthGuard)
export class ActivitiesResolver {
  constructor(
    @Inject(ActivitiesService) private readonly activitiesService: ActivitiesService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Query(() => ActivityConnection)
  activities(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('contactId', { type: () => ID, nullable: true }) contactId?: string,
    @Args('dealId', { type: () => ID, nullable: true }) dealId?: string,
  ) {
    return this.activitiesService.list(user, { first, after, contactId, dealId });
  }

  @Mutation(() => ActivityType)
  createActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { type: () => CreateActivityInput }) input: CreateActivityInput,
  ) {
    return this.activitiesService.create(user, input);
  }

  @ResolveField(() => ContactType, { nullable: true })
  async contact(
    @Parent() activity: Activity,
    @Context() context: GqlContext,
  ): Promise<Contact | null> {
    if (!activity.contactId) {
      return null;
    }

    context.contactLoader ??= createContactLoader(this.prisma, context.user);

    return context.contactLoader.load(activity.contactId);
  }

  @ResolveField(() => DealType, { nullable: true })
  async deal(@Parent() activity: Activity, @Context() context: GqlContext): Promise<Deal | null> {
    if (!activity.dealId) {
      return null;
    }

    context.dealLoader ??= createDealLoader(this.prisma, context.user);

    return context.dealLoader.load(activity.dealId);
  }
}
