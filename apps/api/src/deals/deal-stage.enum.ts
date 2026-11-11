import { registerEnumType } from '@nestjs/graphql';
import { DealStage } from '../generated/prisma/client.js';

registerEnumType(DealStage, {
  name: 'DealStage',
  description: 'Etapas do funil de negociações.',
});

export { DealStage };
