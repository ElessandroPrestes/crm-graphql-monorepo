import { Inject } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import { CompaniesService } from './companies.service.js';
import { CompanyConnection } from './company.connection.js';
import { CreateCompanyInput, UpdateCompanyInput } from './company.input.js';
import { CompanyType } from './company.type.js';

@Resolver(() => CompanyType)
@UseGuards(JwtAuthGuard)
export class CompaniesResolver {
  constructor(@Inject(CompaniesService) private readonly companiesService: CompaniesService) {}

  @Query(() => CompanyConnection)
  companies(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: DEFAULT_PAGE_SIZE,
    })
    first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    return this.companiesService.list(user, { first, after });
  }

  @Query(() => CompanyType)
  company(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.companiesService.findById(user, id);
  }

  @Mutation(() => CompanyType)
  createCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { type: () => CreateCompanyInput }) input: CreateCompanyInput,
  ) {
    return this.companiesService.create(user, input);
  }

  @Mutation(() => CompanyType)
  updateCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateCompanyInput }) input: UpdateCompanyInput,
  ) {
    return this.companiesService.update(user, id, input);
  }

  @Mutation(() => Boolean)
  async deleteCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.companiesService.delete(user, id);

    return true;
  }
}
