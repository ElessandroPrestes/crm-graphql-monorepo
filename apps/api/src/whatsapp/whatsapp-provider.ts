export const WHATSAPP_PROVIDER_TOKEN = Symbol('WHATSAPP_PROVIDER');

export interface SendTextInput {
  phoneNumberId: string;
  to: string;
  text: string;
}

export interface SendTextResult {
  externalId: string;
}

export interface WhatsAppProvider {
  sendText(input: SendTextInput): Promise<SendTextResult>;
}

export class WhatsAppProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppProviderError';
  }
}
