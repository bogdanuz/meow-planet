import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/pwa-e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4173/meow-planet/',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/meow-planet/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'boot-chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'chrome' as const }),
      },
    },
  ],
})
