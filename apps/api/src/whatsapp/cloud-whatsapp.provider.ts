import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../config/env.js';
import {
  WhatsAppProviderError,
  type SendTextInput,
  type SendTextResult,
  type WhatsAppProvider,
} from './whatsapp-provider.js';

interface CloudMessageResponse {
  messages?: Array<{ id?: string }>;
}

export class CloudWhatsAppProvider implements WhatsAppProvider {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<ApiEnv, true>) {}

  async sendText(input: SendTextInput): Promise<SendTextResult> {
    const accessToken = this.config.get('WHATSAPP_ACCESS_TOKEN', { infer: true });

    if (!accessToken) {
      throw new WhatsAppProviderError('WHATSAPP_ACCESS_TOKEN não configurado');
    }

    const baseUrl = this.config.get('WHATSAPP_API_BASE_URL', { infer: true }).replace(/\/+$/, '');
    const version = this.config.get('WHATSAPP_API_VERSION', { infer: true });
    const timeoutMs = this.config.get('WHATSAPP_SEND_TIMEOUT_MS', { infer: true });
    const url = `${baseUrl}/${version}/${encodeURIComponent(input.phoneNumberId)}/messages`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: input.to,
          type: 'text',
          text: { body: input.text },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new WhatsAppProviderError('Falha de rede ao chamar a Cloud API');
    }

    if (!response.ok) {
      throw new WhatsAppProviderError(`Cloud API respondeu com status ${response.status}`);
    }

    const payload = (await response.json().catch(() => null)) as CloudMessageResponse | null;
    const externalId = payload?.messages?.[0]?.id;

    if (!externalId) {
      throw new WhatsAppProviderError('Cloud API não retornou o id da mensagem');
    }

    return { externalId };
  }
}
