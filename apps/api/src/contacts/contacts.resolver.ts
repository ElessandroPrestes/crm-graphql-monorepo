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
import type { Company, Contact } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompanyType } from '../companies/company.type.js';
import { ContactConnection } from './contact.connection.js';
import { CreateContactInput, UpdateContactInput } from './contact.input.js';
import { ContactType } from './contact.type.js';
import { createCompanyLoader } from './company.loader.js';
import { ContactsService } from './contacts.service.js';

@Resolver(() => ContactType)
@UseGuards(JwtAuthGuard)
export class ContactsResolver {
  constructor(
    @Inject(ContactsService) private readonly contactsService: ContactsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Query(() => ContactConnection)
  contacts(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    return this.contactsService.list(user, { first, after });
  }

  @Query(() => ContactType)
  contact(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.contactsService.findById(user, id);
  }

  @Mutation(() => ContactType)
  createContact(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { type: () => CreateContactInput }) input: CreateContactInput,
  ) {
    return this.contactsService.create(user, input);
  }

  @Mutation(() => ContactType)
  updateContact(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateContactInput }) input: UpdateContactInput,
  ) {
    return this.contactsService.update(user, id, input);
  }

  @Mutation(() => Boolean)
  async deleteContact(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.contactsService.delete(user, id);

    return true;
  }

  @ResolveField(() => CompanyType, { nullable: true })
  async company(
    @Parent() contact: Contact,
    @Context() context: GqlContext,
  ): Promise<Company | null> {
    if (!contact.companyId) {
      return null;
    }

    context.companyLoader ??= createCompanyLoader(this.prisma, context.user);

    return context.companyLoader.load(contact.companyId);
  }
}
