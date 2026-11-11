import { registerEnumType } from '@nestjs/graphql';
import { WhatsAppChannel } from '../generated/prisma/client.js';

registerEnumType(WhatsAppChannel, {
  name: 'WhatsAppChannel',
  description: 'Canais de conversa suportados.',
});

export { WhatsAppChannel };
