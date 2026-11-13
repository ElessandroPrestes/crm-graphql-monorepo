import { join } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import depthLimit from 'graphql-depth-limit';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { normalizeIp } from '../common/client-ip.js';
import { RateLimitModule } from '../common/rate-limit/rate-limit.module.js';
import { RateLimitService } from '../common/rate-limit/rate-limit.service.js';
import type { ApiEnv } from '../config/env.js';
import {
  complexityRule,
  createAliasLimitRule,
  MAX_QUERY_ALIASES,
  MAX_QUERY_DEPTH,
} from './validation-rules.js';

interface WsConnectionContext {
  connectionParams?: Record<string, unknown>;
  extra: unknown;
}

interface WsExtra {
  request?: { socket?: { remoteAddress?: string } };
  socket?: {
    remoteAddress?: string;
    close?: (code?: number, reason?: string) => void;
  };
}

function wsClientIp(extra: unknown): string {
  const candidate = extra as WsExtra | undefined;

  return normalizeIp(candidate?.request?.socket?.remoteAddress ?? candidate?.socket?.remoteAddress);
}

function closeRateLimitedSocket(extra: unknown): void {
  const candidate = extra as WsExtra | undefined;

  candidate?.socket?.close?.(4429, 'Too Many Requests');
}

export function stripFieldSuggestions(message: string): string {
  return message.replace(/\s*Did you mean .*$/i, '');
}

@Module({
  imports: [
    AuthModule,
    RateLimitModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule, RateLimitModule],
      inject: [AuthService, ConfigService, RateLimitService],
      useFactory: (
        authService: AuthService,
        config: ConfigService<ApiEnv, true>,
        rateLimit: RateLimitService,
      ): ApolloDriverConfig => {
        const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
        const wsMax = config.get('RATE_LIMIT_WS_MAX', { infer: true });
        const wsWindowSeconds = config.get('RATE_LIMIT_WS_WINDOW_SECONDS', { infer: true });
        const logger = new Logger('GraphQLSubscriptions');
        const schemaPath = join(process.cwd(), '../../packages/graphql-schema/schema.graphql');

        return {
          driver: ApolloDriver,
          autoSchemaFile: isProduction ? true : schemaPath,
          sortSchema: true,
          introspection: !isProduction,
          persistedQueries: false,
          subscriptions: {
            'graphql-ws': {
              path: '/graphql',
              onConnect: async (context: WsConnectionContext) => {
                const params = context.connectionParams ?? {};
                const header =
                  (params.authorization as string | undefined) ??
                  (params.Authorization as string | undefined) ??
                  '';
                const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
                const ip = wsClientIp(context.extra);

                try {
                  const byIp = await rateLimit.consume(
                    `throttle:ws:ip:${ip}`,
                    wsMax,
                    wsWindowSeconds,
                  );

                  if (!byIp.allowed) {
                    closeRateLimitedSocket(context.extra);
                    logger.warn('Handshake WebSocket limitado por IP');
                    throw new Error('Muitas conexões');
                  }
                } catch (error) {
                  if (error instanceof Error && error.message === 'Muitas conexões') {
                    throw error;
                  }

                  logger.warn('Rate limit de WebSocket indisponível; seguindo em fail-open');
                }

                const user = await authService.verifyAccessToken(token);

                try {
                  const byUser = await rateLimit.consume(
                    `throttle:ws:user:${user.id}`,
                    wsMax,
                    wsWindowSeconds,
                  );

                  if (!byUser.allowed) {
                    closeRateLimitedSocket(context.extra);
                    logger.warn('Handshake WebSocket limitado por usuário');
                    throw new Error('Muitas conexões');
                  }
                } catch (error) {
                  if (error instanceof Error && error.message === 'Muitas conexões') {
                    throw error;
                  }

                  logger.warn('Rate limit de WebSocket indisponível; seguindo em fail-open');
                }

                context.extra = { user };

                return true;
              },
            },
          },
          context: (context: unknown) => {
            const candidate = context as {
              req?: Request;
              extra?: { user?: AuthenticatedUser };
            };

            if (candidate.req) {
              return { req: candidate.req };
            }

            return { user: candidate.extra?.user };
          },
          validationRules: [
            depthLimit(MAX_QUERY_DEPTH),
            complexityRule,
            createAliasLimitRule(MAX_QUERY_ALIASES),
          ],
          formatError: (formattedError) => {
            const status = formattedError.extensions?.status;
            const code =
              status === 404
                ? 'NOT_FOUND'
                : status === 409
                  ? 'CONFLICT'
                  : formattedError.extensions?.code;

            if (isProduction && (code === undefined || code === 'INTERNAL_SERVER_ERROR')) {
              return {
                ...formattedError,
                message: 'Erro interno',
                extensions: {
                  ...formattedError.extensions,
                  code: 'INTERNAL_SERVER_ERROR',
                },
              };
            }

            const message =
              isProduction && code === 'GRAPHQL_VALIDATION_FAILED'
                ? stripFieldSuggestions(formattedError.message)
                : formattedError.message;

            return {
              ...formattedError,
              message,
              extensions: {
                ...formattedError.extensions,
                code,
              },
            };
          },
        };
      },
    }),
  ],
})
export class GraphQLApiModule {}
