import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { validateApiEnv } from './config/env.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DealsModule } from './deals/deals.module.js';
import { GraphQLApiModule } from './graphql/graphql.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateApiEnv,
    }),
    PrismaModule,
    RedisModule,
    GraphQLApiModule,
    AuthModule,
    CompaniesModule,
    ContactsModule,
    RealtimeModule,
    DashboardModule,
    DealsModule,
    ActivitiesModule,
    HealthModule,
  ],
})
export class AppModule {}
