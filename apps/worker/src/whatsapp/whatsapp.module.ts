import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisEventPublisher } from '../redis/redis-event.publisher.js';
import { WhatsAppInboundConsumer } from './whatsapp-inbound.consumer.js';
import { WhatsAppInboundProcessor } from './whatsapp-inbound.processor.js';

@Module({
  providers: [
    PrismaService,
    RedisEventPublisher,
    WhatsAppInboundProcessor,
    WhatsAppInboundConsumer,
  ],
})
export class WhatsAppModule {}
