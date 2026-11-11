import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../config/env.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { CloudWhatsAppProvider } from './cloud-whatsapp.provider.js';
import { MockWhatsAppProvider } from './mock-whatsapp.provider.js';
import { WHATSAPP_PROVIDER_TOKEN } from './whatsapp-provider.js';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller.js';

@Module({
  imports: [ConfigModule, MessagingModule],
  controllers: [WhatsAppWebhookController],
  providers: [
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService<ApiEnv, true>) =>
        config.get('WHATSAPP_PROVIDER', { infer: true }) === 'cloud'
          ? new CloudWhatsAppProvider(config)
          : new MockWhatsAppProvider(),
    },
  ],
  exports: [WHATSAPP_PROVIDER_TOKEN],
})
export class WhatsAppModule {}
