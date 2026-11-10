import base from '@nexo/eslint-config/base';
import { createReactConfig } from '@nexo/eslint-config/react';

export default [
  ...base,
  ...createReactConfig(['apps/web/**/*.{ts,tsx}']),
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
