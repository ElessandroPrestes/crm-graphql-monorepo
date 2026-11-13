import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { RateLimitModule } from './common/rate-limit/rate-limit.module.js';
import { validateApiEnv } from './config/env.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DealsModule } from './deals/deals.module.js';
import { GraphQLApiModule } from './graphql/graphql.module.js';
import { GraphQLRateLimitMiddleware } from './graphql/graphql-rate-limit.middleware.js';
import { PersistedQueryMiddleware } from './graphql/persisted-queries.middleware.js';
import { HealthModule } from './health/health.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { RedisModule } from './redis/redis.module.js';
import { WhatsAppModule } from './whatsapp/whatsapp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateApiEnv,
    }),
    PrismaModule,
    RedisModule,
    RateLimitModule,
    GraphQLApiModule,
    AuthModule,
    CompaniesModule,
    ContactsModule,
    RealtimeModule,
    DashboardModule,
    DealsModule,
    ActivitiesModule,
    ConversationsModule,
    MessagesModule,
    WhatsAppModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(GraphQLRateLimitMiddleware, PersistedQueryMiddleware).forRoutes('graphql');
  }
}
