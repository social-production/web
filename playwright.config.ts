import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const crossBrowser = process.env.E2E_CROSS_BROWSER === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(crossBrowser
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          {
            name: 'firefox-mobile',
            use: {
              ...devices['Desktop Firefox'],
              viewport: { width: 390, height: 844 },
              hasTouch: true,
            },
          },
        ]
      : []),
  ],
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev:vite',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
