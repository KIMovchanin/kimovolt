import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:8095',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'dist\\kimovolt-lab.exe',
    url: 'http://127.0.0.1:8095/api/v1/health',
    reuseExistingServer: false,
    timeout: 20_000,
    env: {
      PORT: '8095',
      DB_PATH: './tests/e2e/e2e-test.db',
      STATIC_DIR: './frontend/dist',
      COOKIE_SECURE: 'false',
      PUBLIC_ORIGIN: 'http://127.0.0.1:8095',
    },
  },
});
