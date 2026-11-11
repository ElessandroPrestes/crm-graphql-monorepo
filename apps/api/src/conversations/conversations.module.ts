import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ConversationsResolver } from './conversations.resolver.js';
import { ConversationsService } from './conversations.service.js';

@Module({
  imports: [AuthModule],
  providers: [ConversationsService, ConversationsResolver],
  exports: [ConversationsService],
})
export class ConversationsModule {}
