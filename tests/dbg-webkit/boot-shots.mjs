import { chromium } from 'playwright-core'

const base = process.env.BASE ?? 'http://127.0.0.1:4173/meow-planet/'
const out = process.env.OUT ?? 'boot'
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const delay = Number(process.env.DELAY ?? 120)
await context.route('**/assets/**', async (route) => {
  await new Promise((r) => setTimeout(r, delay))
  await route.continue()
})
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 20, downloadThroughput: 40 * 1024 * 1024 / 8, uploadThroughput: 1e6 })
const shot = async (name) => {
  const path = `${process.env.TEMP}\\sh-${out}-${name}.png`
  await page.screenshot({ path, timeout: 10_000 }).then(() => console.log('saved', path), (e) => console.log('shot fail', name, e.message))
  console.log('state', name, await page.evaluate(() => ({ loader: !!document.querySelector('.boot-loader'), cls: document.querySelector('.boot-loader')?.className, prog: document.querySelector('.boot-loader__progress')?.textContent, app: document.querySelector('#app')?.className })))
}
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto(base, { waitUntil: 'domcontentloaded' })
await page.locator('.boot-loader').waitFor({ timeout: 20_000 })
await page.waitForTimeout(1500)
await shot('wait1')
console.log('progress', await page.locator('.boot-loader__progress').textContent())
await page.waitForTimeout(1700)
await shot('wait2')
console.log('progress', await page.locator('.boot-loader__progress').textContent())
await page.locator('.boot-loader--finale').waitFor({ state: 'attached', timeout: 180_000 })
const t0 = Date.now()
for (const ms of [150, 450, 750, 1050, 1250, 1600]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)))
  await shot(`fin-${ms}`)
}
await page.waitForTimeout(800)
await shot('after')
console.log('loader left', await page.locator('.boot-loader').count(), 'welcome', await page.locator('.screen--welcome').count())
await browser.close()
