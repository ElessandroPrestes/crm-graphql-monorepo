import { randomUUID } from 'node:crypto';
import type { SendTextInput, SendTextResult, WhatsAppProvider } from './whatsapp-provider.js';

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendText(_input: SendTextInput): Promise<SendTextResult> {
    return { externalId: `mock.${randomUUID()}` };
  }
}
