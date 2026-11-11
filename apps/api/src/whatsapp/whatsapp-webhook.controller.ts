import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { WHATSAPP_INBOUND_ROUTING_KEY } from '@nexo/shared';
import type { ApiEnv } from '../config/env.js';
import { RabbitMqService } from '../messaging/rabbitmq.service.js';
import { parseWhatsAppWebhook } from './whatsapp-webhook.parser.js';
import { verifyWhatsAppSignature, verifyWhatsAppToken } from './whatsapp-signature.js';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<ApiEnv, true>,
    @Inject(RabbitMqService) private readonly rabbit: RabbitMqService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() response: Response,
  ): void {
    if (mode !== 'subscribe') {
      throw new BadRequestException('Modo de verificação inválido');
    }

    const expected = this.config.get('WHATSAPP_VERIFY_TOKEN', { infer: true });

    if (!verifyWhatsAppToken(token, expected)) {
      throw new ForbiddenException('Token de verificação inválido');
    }

    if (!challenge) {
      throw new BadRequestException('Challenge ausente');
    }

    response.type('text/plain').send(challenge);
  }

  @Post()
  @HttpCode(200)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
  ): Promise<{ status: 'accepted' | 'ignored' }> {
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Corpo bruto indisponível');
    }

    const appSecret = this.config.get('WHATSAPP_APP_SECRET', { infer: true });

    if (!verifyWhatsAppSignature(rawBody, signature, appSecret)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    let payload: unknown;

    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Payload inválido');
    }

    let events;

    try {
      events = parseWhatsAppWebhook(payload);
    } catch {
      throw new BadRequestException('Payload inválido');
    }

    if (events.length === 0) {
      return { status: 'ignored' };
    }

    for (const event of events) {
      await this.rabbit.publish(WHATSAPP_INBOUND_ROUTING_KEY, event, event.externalId);
    }

    return { status: 'accepted' };
  }
}
