import { Module } from '@nestjs/common';
import { DealEventsService } from './deal-events.service.js';

@Module({
  providers: [DealEventsService],
  exports: [DealEventsService],
})
export class RealtimeModule {}
