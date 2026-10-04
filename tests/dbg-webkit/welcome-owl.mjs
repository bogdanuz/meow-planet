import { chromium } from 'playwright-core'

const base = 'http://127.0.0.1:5173/meow-planet/'
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
const page = await context.newPage()
const reqs = []
page.on('request', (r) => {
  const u = r.url()
  if (/\.(png|webp|mp3|m4a|ogg|wav|jpg)(\?|$)/.test(u)) reqs.push({ t: Date.now(), u: u.replace(base, '') })
})
page.on('requestfinished', (r) => {
  if (r.url().includes('welcome-olli-open')) console.log('owl finished at', Date.now() - t0)
})
await page.goto(base, { waitUntil: 'domcontentloaded' })
const t0 = Date.now()
await page.locator('.screen--welcome').waitFor({ state: 'visible', timeout: 30_000 })
console.log('welcome visible after', Date.now() - t0, 'ms')
for (let i = 0; i < 30; i += 1) {
  const s = await page.evaluate(() => {
    const img = document.querySelector('.welcome__olli-open')
    const r = img?.getBoundingClientRect()
    return {
      complete: img?.complete,
      nh: img?.naturalHeight,
      w: Math.round(r?.width ?? -1),
      h: Math.round(r?.height ?? -1),
      loader: !!document.querySelector('.boot-loader'),
      loaderCls: document.querySelector('.boot-loader')?.className ?? '',
    }
  })
  console.log(Date.now() - t0, JSON.stringify(s))
  if (s.h > 200 && !s.loader) break
  await page.waitForTimeout(50)
}
console.log('media requests total:', reqs.length)
for (const r of reqs.slice(0, 40)) console.log('  ', r.t - t0, r.u.slice(-70))
await browser.close()
