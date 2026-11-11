import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';

async function main(): Promise<void> {
  process.env.NODE_ENV ??= 'test';

  const app = await NestFactory.create(AppModule, { logger: false });

  await app.init();
  await app.close();
}

void main().catch((error: unknown) => {
  console.error('Falha ao gerar o schema GraphQL:', error);
  process.exitCode = 1;
});
