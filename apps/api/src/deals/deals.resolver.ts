import { Inject, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  Subscription,
} from '@nestjs/graphql';
import type { AuthenticatedUser, GqlContext } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { ApiEnv } from '../config/env.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CompanyType } from '../companies/company.type.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import { createCompanyLoader } from '../contacts/company.loader.js';
import { ContactType } from '../contacts/contact.type.js';
import type { Company, Contact, Deal } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealEventsService, type DealMovedPayload } from '../realtime/deal-events.service.js';
import { DealConnection } from './deal.connection.js';
import { DealStage } from './deal-stage.enum.js';
import { CreateDealInput, UpdateDealInput } from './deal.input.js';
import { DealType } from './deal.type.js';
import { DealsService } from './deals.service.js';
import { createContactLoader } from './contact.loader.js';

@Resolver(() => DealType)
@UseGuards(JwtAuthGuard)
export class DealsResolver {
  constructor(
    @Inject(DealsService) private readonly dealsService: DealsService,
    @Inject(DealEventsService) private readonly dealEvents: DealEventsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService<ApiEnv, true>,
  ) {}

  @Query(() => DealConnection)
  deals(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('contactId', { type: () => ID, nullable: true }) contactId?: string,
    @Args('companyId', { type: () => ID, nullable: true }) companyId?: string,
    @Args('stages', { type: () => [DealStage], nullable: true }) stages?: DealStage[],
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    return this.dealsService.list(user, { first, after, contactId, companyId, stages, search });
  }

  @Query(() => DealType)
  deal(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.dealsService.findById(user, id);
  }

  @Mutation(() => DealType)
  createDeal(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { type: () => CreateDealInput }) input: CreateDealInput,
  ) {
    return this.dealsService.create(user, input);
  }

  @Mutation(() => DealType)
  updateDeal(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateDealInput }) input: UpdateDealInput,
  ) {
    return this.dealsService.update(user, id, input);
  }

  @Mutation(() => Boolean)
  async deleteDeal(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.dealsService.delete(user, id);

    return true;
  }

  @Subscription(() => DealType, {
    filter(
      payload: DealMovedPayload,
      variables: { dealId?: string },
      context: GqlContext,
    ): boolean {
      const user = context.user;

      if (!user) {
        return false;
      }

      if (variables.dealId && payload.dealMoved.id !== variables.dealId) {
        return false;
      }

      return user.role === 'ADMIN' || payload.dealMoved.ownerId === user.id;
    },
    resolve: (payload: DealMovedPayload): Deal => payload.dealMoved,
  })
  dealMoved(
    @Args('dealId', { type: () => ID, nullable: true }) _dealId?: string,
  ): AsyncIterableIterator<DealMovedPayload> {
    return this.dealEvents.createIterator();
  }

  @ResolveField(() => ContactType, { nullable: true })
  async contact(@Parent() deal: Deal, @Context() context: GqlContext): Promise<Contact | null> {
    if (!deal.contactId) {
      return null;
    }

    if (!this.config.get('DATALOADER_ENABLED', { infer: true })) {
      return this.prisma.contact.findFirst({
        where: {
          id: deal.contactId,
          ...(context.user?.role === 'ADMIN' ? {} : { ownerId: context.user?.id }),
        },
      });
    }

    context.contactLoader ??= createContactLoader(this.prisma, context.user);

    return context.contactLoader.load(deal.contactId);
  }

  @ResolveField(() => CompanyType, { nullable: true })
  async company(@Parent() deal: Deal, @Context() context: GqlContext): Promise<Company | null> {
    if (!deal.companyId) {
      return null;
    }

    if (!this.config.get('DATALOADER_ENABLED', { infer: true })) {
      return this.prisma.company.findFirst({
        where: {
          id: deal.companyId,
          ...(context.user?.role === 'ADMIN' ? {} : { ownerId: context.user?.id }),
        },
      });
    }

    context.companyLoader ??= createCompanyLoader(this.prisma, context.user);

    return context.companyLoader.load(deal.companyId);
  }
}
