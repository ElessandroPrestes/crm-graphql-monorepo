import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['../../apps/web/src/**/*.{ts,tsx,graphql}'],
  generates: {
    './src/types.ts': {
      plugins: ['typescript'],
      config: {
        immutableTypes: true,
        maybeValue: 'T | null',
      },
    },
    './src/operations.ts': {
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        immutableTypes: true,
        maybeValue: 'T | null',
        dedupeOperationSuffix: true,
      },
    },
  },
};

export default config;
