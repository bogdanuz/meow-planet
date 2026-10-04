import { chromium } from 'playwright-core'

const base = 'http://127.0.0.1:4173/meow-planet/'
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
const page = await context.newPage()
await page.goto(base, { waitUntil: 'domcontentloaded' })
await page.locator('.screen--welcome').waitFor({ state: 'visible', timeout: 120_000 })
await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined)
await page.evaluate(() => navigator.serviceWorker.ready)
await page.reload()
await page.locator('.screen--welcome').waitFor({ state: 'visible', timeout: 30_000 })
await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15_000 })
const result = await page.evaluate(async () => {
  const controlled = Boolean(navigator.serviceWorker.controller)
  const probe = async (url, range) => {
    const res = await fetch(url, range ? { headers: { Range: range } } : {})
    const body = await res.arrayBuffer()
    return { url, range, status: res.status, contentRange: res.headers.get('content-range'), contentType: res.headers.get('content-type'), bytes: body.byteLength }
  }
  return {
    controlled,
    rows: [
      await probe('assets/audio/hub-music.mp3', 'bytes=0-1'),
      await probe('assets/audio/hub-music.mp3', 'bytes=100-'),
      await probe('assets/audio/hub-music.mp3', null),
    ],
  }
})
console.log(JSON.stringify(result, null, 1))
await context.setOffline(true)
const offline = await page.evaluate(async () => {
  const res = await fetch('assets/audio/hub-music.mp3', { headers: { Range: 'bytes=0-1' } })
  return { status: res.status, contentRange: res.headers.get('content-range'), bytes: (await res.arrayBuffer()).byteLength }
})
console.log('offline', JSON.stringify(offline))
await browser.close()
