import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Локально: системный Chrome — обход K-004 (CDN playwright.dev таймаут).
        // В CI остаётся bundled Chromium после `playwright install`.
        ...(process.env.CI ? {} : { channel: 'chrome' as const }),
      },
    },
    {
      name: 'ipad-chromium',
      use: {
        ...devices['Desktop Chrome'],
        // iPad Pro 11 в альбоме — хаб только landscape
        viewport: {
          width: devices['iPad Pro 11'].viewport!.height,
          height: devices['iPad Pro 11'].viewport!.width,
        },
        hasTouch: true,
        isMobile: true,
        ...(process.env.CI ? {} : { channel: 'chrome' as const }),
      },
    },
  ],
})
