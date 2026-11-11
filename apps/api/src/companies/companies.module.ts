import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CompaniesResolver } from './companies.resolver.js';
import { CompaniesService } from './companies.service.js';

@Module({
  imports: [AuthModule],
  providers: [CompaniesService, CompaniesResolver],
})
export class CompaniesModule {}
