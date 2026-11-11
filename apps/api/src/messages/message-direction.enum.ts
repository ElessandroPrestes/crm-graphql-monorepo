import { registerEnumType } from '@nestjs/graphql';
import { MessageDirection } from '../generated/prisma/client.js';

registerEnumType(MessageDirection, {
  name: 'MessageDirection',
  description: 'Direção da mensagem na conversa.',
});

export { MessageDirection };
