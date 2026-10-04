import { chromium } from 'playwright-core'

const base = process.env.BASE ?? 'http://127.0.0.1:5173/meow-planet/'
const run = process.env.RUN ?? 'pre'
const cpu = Number(process.env.CPU ?? 4)
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
const page = await context.newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto(base + '#/menu', { waitUntil: 'domcontentloaded' })
await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => undefined)
await page.waitForTimeout(800)
await page.locator('[data-game-id="drawing"]').click()
await page.locator('.drawing[data-ready="1"]').waitFor({ timeout: 20_000 })
await page.waitForTimeout(800)
const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })

for (const brush of ['brush', 'watercolor', 'crayon']) {
  await page.getByRole('button', { name: 'Кисть' }).click()
  await page.locator(`[data-brush="${brush}"]`).click()
  await page.waitForTimeout(400)
  const stats = await page.locator('.drawing__canvas').evaluate(async (node, perFrame) => {
    const rect = node.getBoundingClientRect()
    const ev = (type, fx, fy) =>
      new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: rect.left + rect.width * fx, clientY: rect.top + rect.height * fy })
    node.dispatchEvent(ev('pointerdown', 0.1, 0.5))
    const frames = []
    let last = performance.now()
    const t0 = last
    let i = 0
    await new Promise((resolve) => {
      const tick = (now) => {
        frames.push(now - last)
        last = now
        for (let k = 0; k < perFrame; k += 1) {
          i += 1
          const t = i / 360
          window.dispatchEvent(ev('pointermove', 0.1 + 0.8 * ((t * 3) % 1), 0.3 + 0.4 * Math.abs(Math.sin(t * 9))))
        }
        if (now - t0 < 3000) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    window.dispatchEvent(ev('pointerup', 0.5, 0.5))
    frames.shift()
    const long = frames.filter((f) => f > 20).length
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length
    return { frames: frames.length, avgFrameMs: +avg.toFixed(1), framesOver20ms: long, worstMs: Math.round(Math.max(...frames)), moves: i }
  }, 2)
  console.log(run, `cpu x${cpu}`, brush, JSON.stringify(stats))
  await page.waitForTimeout(500)
}
await browser.close()
