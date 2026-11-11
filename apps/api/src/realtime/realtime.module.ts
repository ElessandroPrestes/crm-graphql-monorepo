import { Module } from '@nestjs/common';
import { DealEventsService } from './deal-events.service.js';
import { MessageEventsService } from './message-events.service.js';

@Module({
  providers: [DealEventsService, MessageEventsService],
  exports: [DealEventsService, MessageEventsService],
})
export class RealtimeModule {}
