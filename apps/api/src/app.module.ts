import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { validateApiEnv } from './config/env.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { GraphQLApiModule } from './graphql/graphql.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateApiEnv,
    }),
    PrismaModule,
    GraphQLApiModule,
    AuthModule,
    CompaniesModule,
    ContactsModule,
    HealthModule,
  ],
})
export class AppModule {}
