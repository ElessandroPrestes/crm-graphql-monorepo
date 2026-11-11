import { registerEnumType } from '@nestjs/graphql';
import { ActivityType } from '../generated/prisma/client.js';

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Tipos de interação registrados na linha do tempo.',
});

export { ActivityType };
