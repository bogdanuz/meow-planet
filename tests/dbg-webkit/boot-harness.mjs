import { chromium } from 'playwright-core'

const base = process.env.BASE ?? 'http://127.0.0.1:5173/meow-planet/'
const out = process.env.OUT ?? 'bh'
const vw = Number(process.env.VW ?? 1180)
const vh = Number(process.env.VH ?? 820)
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const page = await context.newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message))
const shot = async (name) => {
  const path = `${process.env.TEMP}\\sh-${out}-${name}.png`
  await page.screenshot({ path })
  console.log('saved', path)
}
await page.goto(base + '#/', { waitUntil: 'domcontentloaded' })
await page.locator('.screen--welcome').waitFor({ timeout: 60_000 })
await page.waitForTimeout(800)
await page.evaluate(async () => {
  const mod = await import('/meow-planet/src/app/boot-loader.ts')
  const host = document.createElement('div')
  document.body.append(host)
  window.__bl = mod.mountBootLoader(host)
  window.__bl.setProgress({ percent: 37, message: 'Подготавливаем игры', doneCount: 540, totalCount: 1470 })
})
await page.waitForTimeout(1500)
await shot('wait')
// Ловим моргание: веки видны ~5% периода.
for (let i = 0; i < 60; i += 1) {
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('.boot-loader__lid')).opacity)
  if (Number(op) > 0.8) {
    await shot('blink')
    break
  }
  await page.waitForTimeout(60)
}
await page.evaluate(() => window.__bl.setProgress({ percent: 99, message: 'Почти готово', doneCount: 1460, totalCount: 1470 }))
await page.waitForTimeout(400)
await shot('p99')
await page.evaluate(() => document.querySelector('.boot-loader').classList.add('boot-loader--finale'))
await page.waitForTimeout(50)
for (const ms of [0, 200, 400, 600, 800, 1000, 1099]) {
  await page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      a.pause()
      a.currentTime = t
    }
  }, ms)
  await shot(`fin-${ms}`)
}
await page.evaluate(() => {
  for (const a of document.getAnimations()) a.play()
  document.querySelector('.boot-loader').classList.remove('boot-loader--finale')
  return window.__bl.finish().then(() => window.__bl.unmount())
})
await page.waitForTimeout(100)
await shot('leave')
await page.waitForTimeout(500)
console.log('loader left', await page.locator('.boot-loader').count())
await browser.close()
