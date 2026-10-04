import { test } from '@playwright/test'

test('voice and viewport on webkit iPad', async ({ page }) => {
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('console error:', m.text())
  })
  await page.goto('./#/', { waitUntil: 'domcontentloaded' })
  await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 200_000 })
  await page.waitForTimeout(1500)
  console.log('sw', await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)))
  await page.goto('./#/menu', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('[data-game-id="sort-colors"]').tap()
  await page.waitForTimeout(3000)
  const shape = page.locator('.sort-colors-item, [data-item]').first()
  if (await shape.count()) await shape.tap().catch(() => undefined)
  await page.waitForTimeout(4000)
  await page.goto('./#/menu', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('[data-game-id="balloon-pop"]').tap()
  await page.waitForTimeout(6000)
  await page.mouse.click(600, 400)
  await page.waitForTimeout(4000)
})
