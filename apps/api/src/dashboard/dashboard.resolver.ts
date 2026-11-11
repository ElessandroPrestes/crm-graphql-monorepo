import { Inject, UseGuards } from '@nestjs/common';
import { Args, GraphQLISODateTime, Query, Resolver } from '@nestjs/graphql';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DashboardMetricsType } from './dashboard.type.js';
import { DashboardService } from './dashboard.service.js';

@Resolver(() => DashboardMetricsType)
@UseGuards(JwtAuthGuard)
export class DashboardResolver {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardMetricsType)
  dashboardMetrics(
    @CurrentUser() user: AuthenticatedUser,
    @Args('periodStart', { type: () => GraphQLISODateTime, nullable: true })
    periodStart?: Date,
    @Args('periodEnd', { type: () => GraphQLISODateTime, nullable: true })
    periodEnd?: Date,
  ) {
    return this.dashboardService.metrics(user, { periodStart, periodEnd });
  }
}
