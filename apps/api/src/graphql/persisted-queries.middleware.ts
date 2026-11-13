import { Inject, Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PERSISTED_QUERIES } from './persisted-queries.generated.js';
import type { NextFunction, Request, Response } from 'express';
import type { ApiEnv } from '../config/env.js';

type PersistedQueryMode = ApiEnv['PERSISTED_QUERIES_MODE'];

interface GraphqlRequestBody {
  query?: string;
  extensions?: {
    persistedQuery?: {
      version?: number;
      sha256Hash?: string;
    };
  };
}

function sendPersistedQueryError(response: Response, message: string, code: string): void {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({
    errors: [
      {
        message,
        extensions: { code },
      },
    ],
  });
}

function clearPersistedQueryExtension(body: GraphqlRequestBody): void {
  if (!body.extensions) {
    return;
  }

  delete body.extensions.persistedQuery;

  if (Object.keys(body.extensions).length === 0) {
    delete body.extensions;
  }
}

@Injectable()
export class PersistedQueryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PersistedQueryMiddleware.name);
  private readonly mode: PersistedQueryMode;

  constructor(@Inject(ConfigService) config: ConfigService<ApiEnv, true>) {
    this.mode = config.get('PERSISTED_QUERIES_MODE', { infer: true });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    if (this.mode === 'off') {
      next();
      return;
    }

    if (request.method === 'OPTIONS' || request.method === 'HEAD') {
      next();
      return;
    }

    if (request.method !== 'POST') {
      if (this.mode === 'enforce') {
        response.setHeader('Cache-Control', 'no-store');
        response.status(405).json({
          errors: [
            {
              message: 'Use POST com persisted query',
              extensions: { code: 'PERSISTED_QUERY_REQUIRED' },
            },
          ],
        });
        return;
      }

      next();
      return;
    }

    const body = request.body as GraphqlRequestBody | undefined;
    const sha256Hash = body?.extensions?.persistedQuery?.sha256Hash;

    if (!sha256Hash) {
      if (this.mode === 'enforce') {
        sendPersistedQueryError(response, 'PersistedQueryRequired', 'PERSISTED_QUERY_REQUIRED');
        return;
      }

      next();
      return;
    }

    const entry = PERSISTED_QUERIES[sha256Hash];

    if (entry && body) {
      body.query = entry.query;
      clearPersistedQueryExtension(body);
      next();
      return;
    }

    if (this.mode === 'audit' && body?.query) {
      this.logger.warn({
        message: 'Operação GraphQL fora da allowlist de persisted queries',
        sha256Hash: sha256Hash.slice(0, 12),
      });
      clearPersistedQueryExtension(body);
      next();
      return;
    }

    sendPersistedQueryError(response, 'PersistedQueryNotFound', 'PERSISTED_QUERY_NOT_FOUND');
  }
}
