import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { MessagesResolver } from './messages.resolver.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [AuthModule, ConversationsModule, RealtimeModule, WhatsAppModule],
  providers: [MessagesService, MessagesResolver],
})
export class MessagesModule {}
