import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 180_000,
  },
});
