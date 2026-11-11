import { registerEnumType } from '@nestjs/graphql';
import { MessageStatus } from '../generated/prisma/client.js';

registerEnumType(MessageStatus, {
  name: 'MessageStatus',
  description: 'Estado de processamento ou envio da mensagem.',
});

export { MessageStatus };
