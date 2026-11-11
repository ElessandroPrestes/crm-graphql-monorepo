import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { ApiEnv } from '../config/env.js';
import { RabbitMqService } from './rabbitmq.service.js';

function serviceWithUrl(url: string): RabbitMqService {
  const config = {
    get: (key: string) => (key === 'RABBITMQ_URL' ? url : undefined),
  } as unknown as ConfigService<ApiEnv, true>;

  return new RabbitMqService(config);
}

describe('RabbitMqService', () => {
  it('returns 503 when the broker is unavailable', async () => {
    const service = serviceWithUrl('amqp://guest:guest@127.0.0.1:1');
    const publish = service.publish('whatsapp.inbound', { hello: 'world' }, 'message-1');

    await expect(publish).rejects.toBeInstanceOf(ServiceUnavailableException);
    await service.onModuleDestroy();
  });
});
