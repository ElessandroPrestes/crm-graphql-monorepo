import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqService } from './rabbitmq.service.js';

@Module({
  imports: [ConfigModule],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class MessagingModule {}
