import { Inject, Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PERSISTED_QUERIES } from './persisted-queries.generated.js';
import type { NextFunction, Request, Response } from 'express';
import type { AccessTokenPayload } from '../auth/auth.types.js';
import { clientIp } from '../common/client-ip.js';
import { RateLimitService } from '../common/rate-limit/rate-limit.service.js';
import type { ApiEnv } from '../config/env.js';

interface GraphqlRequestBody {
  query?: string;
  extensions?: {
    persistedQuery?: {
      sha256Hash?: string;
    };
  };
}

function isWriteOperation(query: string | undefined): boolean {
  return query ? /^\s*mutation\b/.test(query) : false;
}

function resolveQuery(request: Request): string | undefined {
  const body = request.body as GraphqlRequestBody | undefined;

  if (body?.query) {
    return body.query;
  }

  if (typeof request.query?.query === 'string') {
    return request.query.query;
  }

  const sha256Hash = body?.extensions?.persistedQuery?.sha256Hash;

  return sha256Hash ? PERSISTED_QUERIES[sha256Hash]?.query : undefined;
}

function sendRateLimitError(response: Response, retryAfterSeconds: number): void {
  response.setHeader('Retry-After', String(retryAfterSeconds));
  response.setHeader('Cache-Control', 'no-store');
  response.status(429).json({
    errors: [
      {
        message: 'Muitas requisições. Tente novamente mais tarde.',
        extensions: { code: 'RATE_LIMITED' },
      },
    ],
  });
}

@Injectable()
export class GraphQLRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GraphQLRateLimitMiddleware.name);
  private readonly userMax: number;
  private readonly anonymousMax: number;
  private readonly writeMax: number;
  private readonly windowSeconds: number;

  constructor(
    @Inject(ConfigService) config: ConfigService<ApiEnv, true>,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {
    this.userMax = config.get('RATE_LIMIT_GRAPHQL_USER_MAX', { infer: true });
    this.anonymousMax = config.get('RATE_LIMIT_GRAPHQL_ANON_MAX', { infer: true });
    this.writeMax = config.get('RATE_LIMIT_GRAPHQL_WRITE_MAX', { infer: true });
    this.windowSeconds = config.get('RATE_LIMIT_GRAPHQL_WINDOW_SECONDS', { infer: true });
  }

  async use(request: Request, response: Response, next: NextFunction): Promise<void> {
    if (request.method !== 'POST' && request.method !== 'GET') {
      next();
      return;
    }

    const write = isWriteOperation(resolveQuery(request));
    const ip = clientIp(request);
    const authorization = request.headers.authorization;
    let key = `ip:${ip}`;
    let limit = this.anonymousMax;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length).trim();

      try {
        const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
        key = `user:${payload.sub}`;
        limit = write ? this.writeMax : this.userMax;
      } catch {
        key = `ip:${ip}`;
      }
    }

    if (write && key.startsWith('ip:')) {
      limit = Math.min(this.writeMax, this.anonymousMax);
    }

    try {
      const result = await this.rateLimit.consume(
        `throttle:graphql:${key}`,
        limit,
        this.windowSeconds,
      );

      if (!result.allowed) {
        sendRateLimitError(response, result.retryAfterSeconds);
        return;
      }
    } catch {
      this.logger.warn('Rate limit GraphQL indisponível; seguindo em modo fail-open');
    }

    next();
  }
}
