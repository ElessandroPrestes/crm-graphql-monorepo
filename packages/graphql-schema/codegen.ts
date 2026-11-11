import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: [],
  generates: {
    './src/types.ts': {
      plugins: ['typescript'],
      config: {
        immutableTypes: true,
        maybeValue: 'T | null',
      },
    },
  },
};

export default config;
