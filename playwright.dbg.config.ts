import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/dbg-webkit',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 240_000,
  use: {
    baseURL: 'http://127.0.0.1:4173/meow-planet/',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/meow-planet/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'ipad-webkit',
      use: {
        ...devices['iPad Pro 11 landscape'],
        browserName: 'webkit',
        launchOptions: { executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\webkit-2248\\Playwright.exe` },
      },
    },
  ],
})
