import { defineConfig, devices } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3202';
const webUrl = 'http://127.0.0.1:5217';
const e2eEnv = {
  NODE_ENV: 'test',
  API_PORT: '3202',
  DATABASE_URL: 'postgresql://nexo:nexo@127.0.0.1:5402/nexo?schema=public',
  REDIS_URL: 'redis://127.0.0.1:8203',
  RABBITMQ_URL: 'amqp://nexo:nexo@127.0.0.1:8204',
  CORS_ORIGINS: webUrl,
  ACCESS_TOKEN_SECRET: 'e2e-only-access-token-secret-32-chars',
  ACCESS_TOKEN_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_SECONDS: '604800',
  REFRESH_COOKIE_NAME: 'nexo_refresh',
  PERSISTED_QUERIES_MODE: 'audit',
  JSON_BODY_LIMIT: '256kb',
  RATE_LIMIT_LOGIN_IP_MAX: '1000',
  RATE_LIMIT_LOGIN_EMAIL_MAX: '1000',
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: '900',
  LOGIN_LOCK_THRESHOLD: '100',
  LOGIN_LOCK_SECONDS: '900',
  RATE_LIMIT_GRAPHQL_USER_MAX: '1000',
  RATE_LIMIT_GRAPHQL_ANON_MAX: '5',
  RATE_LIMIT_GRAPHQL_WRITE_MAX: '1000',
  RATE_LIMIT_GRAPHQL_WINDOW_SECONDS: '60',
  RATE_LIMIT_WS_MAX: '1000',
  RATE_LIMIT_WS_WINDOW_SECONDS: '60',
  WHATSAPP_PROVIDER: 'mock',
  WHATSAPP_VERIFY_TOKEN: 'e2e-only-whatsapp-verify-token',
  WHATSAPP_APP_SECRET: 'e2e-only-whatsapp-app-secret',
};

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results/playwright',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth-setup\.ts/,
    },
    {
      name: 'desktop-chromium',
      testIgnore: [/security\.spec\.ts/, /a11y\//],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      testIgnore: [/security\.spec\.ts/, /a11y\//],
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'api-security',
      testMatch: /security\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y',
      testDir: './e2e/a11y',
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @nexo/api start',
      url: `${apiUrl}/health/live`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { ...process.env, ...e2eEnv },
    },
    {
      command: 'pnpm --filter @nexo/web dev --host 127.0.0.1 --port 5217',
      url: webUrl,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { ...process.env, VITE_API_URL: apiUrl },
    },
  ],
});
