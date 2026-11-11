import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import depthLimit from 'graphql-depth-limit';
import {
  complexityRule,
  createAliasLimitRule,
  MAX_QUERY_ALIASES,
  MAX_QUERY_DEPTH,
} from './validation-rules.js';

const isProduction = process.env.NODE_ENV === 'production';
const schemaPath = join(process.cwd(), '../../packages/graphql-schema/schema.graphql');

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: isProduction ? true : schemaPath,
      sortSchema: true,
      introspection: !isProduction,
      context: ({ req }: { req: Request }) => ({ req }),
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
    }),
  ],
})
export class GraphQLApiModule {}
