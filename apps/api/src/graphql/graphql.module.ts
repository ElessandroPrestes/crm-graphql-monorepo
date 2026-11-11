import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import depthLimit from 'graphql-depth-limit';
import { AuthModule } from '../auth/auth.module.js';
import { AuthService } from '../auth/auth.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
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

@Module({
  imports: [
    AuthModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [AuthService],
      useFactory: (authService: AuthService): ApolloDriverConfig => {
        const isProduction = process.env.NODE_ENV === 'production';
        const schemaPath = join(process.cwd(), '../../packages/graphql-schema/schema.graphql');

        return {
          driver: ApolloDriver,
          autoSchemaFile: isProduction ? true : schemaPath,
          sortSchema: true,
          introspection: !isProduction,
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
                const user = await authService.verifyAccessToken(token);

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

            return {
              ...formattedError,
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
