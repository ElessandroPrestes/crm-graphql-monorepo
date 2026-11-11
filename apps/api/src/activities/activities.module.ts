import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { ActivitiesResolver } from './activities.resolver.js';
import { ActivitiesService } from './activities.service.js';

@Module({
  imports: [AuthModule, DashboardModule],
  providers: [ActivitiesService, ActivitiesResolver],
})
export class ActivitiesModule {}
