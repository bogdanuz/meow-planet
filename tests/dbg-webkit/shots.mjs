import { chromium } from 'playwright-core'

const base = 'http://127.0.0.1:5173/meow-planet/'
const out = process.env.OUT ?? 'after'
const scenes = (process.env.SCENES ?? 'balloon,sort,counting').split(',')
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const page = await context.newPage()
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${process.env.TEMP}\\sh-${out}-${name}.png` })
const scrolled = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => el.scrollTop || el.scrollLeft)
      .map((el) => `${el.tagName}.${el.className}:${el.scrollLeft},${el.scrollTop}`),
  )
async function open(id) {
  await page.goto(base + '#/menu', { waitUntil: 'domcontentloaded' })
  await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => undefined)
  await wait(1500)
  await page.locator(`[data-game-id="${id}"]`).tap()
  await wait(3500)
}
async function dragHold(locator, dx, dy) {
  const box = await locator.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + dx / 2, box.y + dy / 2, { steps: 8 })
  await page.mouse.move(box.x + dx, box.y + dy, { steps: 8 })
  await wait(400)
}

if (scenes.includes('welcome')) {
  await page.goto(base + '#/', { waitUntil: 'domcontentloaded' })
  await page.locator('.boot-loader').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => undefined)
  await wait(2500)
  await shot('welcome')
  await page.goto(base + '#/menu', { waitUntil: 'domcontentloaded' })
  await wait(2500)
  await shot('menu')
  const tile = await page.locator('.game-tile').first().boundingBox()
  await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2)
  await page.mouse.down()
  await wait(300)
  await shot('menu-press')
  await page.mouse.move(5, 5)
  await page.mouse.up()
}
if (scenes.includes('balloon')) {
  await open('balloon-pop')
  await shot('balloon')
}
if (scenes.includes('sort')) {
  await open('sort-colors')
  await shot('sort')
  await dragHold(page.locator('.sort-colors__toy').nth(3), 60, -200)
  console.log('sort drag scrolled', JSON.stringify(await scrolled()))
  await shot('sort-drag')
  await page.mouse.up()
}
if (scenes.includes('counting')) {
  await open('counting')
  await shot('counting')
  await dragHold(page.locator('.counting__rug .counting__toy').first(), -250, -150)
  console.log('counting drag scrolled', JSON.stringify(await scrolled()))
  await shot('counting-drag')
  await page.mouse.up()
}
if (scenes.includes('shape')) {
  await open('shape-build')
  await wait(1500)
  await shot('shape')
  const cab = await page.evaluate(() => document.querySelector('.shape-build')?.dataset.cabinet)
  if (cab !== 'open') await page.locator('.shape-build__handle').tap().catch(() => undefined)
  await wait(900)
  await shot('shape-open')
  console.log(
    'cabinet shadow',
    await page.evaluate(() => {
      const el = document.querySelector('.shape-build__cabinet-shadow')
      return el && { bi: getComputedStyle(el).borderImageSource.slice(0, 30), rect: el.getBoundingClientRect().toJSON() }
    }),
  )
  await page.screenshot({ path: `${process.env.TEMP}\\sh-${out}-shape-cab.png`, clip: { x: 820, y: 80, width: 360, height: 700 } })
  const item = page.locator('.shape-build__shelf-item, .shape-build__shelf-btn, .shape-build__shelf button').first()
  const box = await item.boundingBox().catch(() => null)
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x - 150, box.y + 40, { steps: 6 })
    await page.mouse.move(box.x - 350, box.y + 80, { steps: 6 })
    await wait(300)
    await shot('shape-carry')
    await page.mouse.up()
  }
}
if (scenes.includes('sound')) {
  for (const id of ['drum', 'maracas', 'bell', 'piano', 'guitar']) {
    await open('sound-world')
    await page.locator('[data-main-tab="instruments"]').tap()
    await wait(600)
    await page.locator(`[data-card-id="${id}"]`).tap()
    await wait(2500)
    if (id === 'bell') {
      await page.locator('.sound-world__bell').tap()
      await wait(250)
    }
    if (id === 'maracas') {
      await page.locator('.sound-world__maraca').first().tap()
      await wait(200)
    }
    await shot(`sound-${id}`)
  }
}
await browser.close()
