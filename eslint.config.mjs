import base from '@nexo/eslint-config/base';
import { createReactConfig } from '@nexo/eslint-config/react';

export default [
  {
    ignores: [
      'packages/graphql-schema/src/operations.ts',
      'apps/api/src/graphql/persisted-queries.generated.ts',
    ],
  },
  ...base,
  ...createReactConfig(['apps/web/**/*.{ts,tsx}']),
  {
    files: [
      'apps/web/src/auth/auth-context.tsx',
      'apps/web/src/appearance/theme-provider.tsx',
      'apps/web/src/i18n/i18n-context.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['apps/web/**/*.tsx'],
    rules: {
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts', 'apps/worker/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['**/*.config.{js,mjs,cjs,ts}', '**/vite.config.ts', '**/vitest.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
