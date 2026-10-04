import { chromium } from 'playwright-core'

const base = 'http://127.0.0.1:5173/meow-planet/'
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true })
const page = await context.newPage()
const wait = (ms) => page.waitForTimeout(ms)
await page.goto(base + '#/', { waitUntil: 'domcontentloaded' })
await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 60_000 })
await wait(1000)
await page.touchscreen.tap(590, 410)
await wait(1500)
for (const id of ['sort-colors', 'hide-seek', 'counting']) {
  await page.goto(base + '#/menu', { waitUntil: 'domcontentloaded' })
  await wait(1200)
  await page.locator(`[data-game-id="${id}"]`).tap()
  await wait(3500)
  await page.touchscreen.tap(560, 560)
  await wait(14000)
}
await browser.close()
