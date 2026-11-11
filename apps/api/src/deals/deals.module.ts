import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { DealsResolver } from './deals.resolver.js';
import { DealsService } from './deals.service.js';

@Module({
  imports: [AuthModule, DashboardModule, RealtimeModule],
  providers: [DealsService, DealsResolver],
})
export class DealsModule {}
