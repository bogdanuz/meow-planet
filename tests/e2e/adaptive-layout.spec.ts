import { expect, test, type Page } from '@playwright/test'
import { openGame, openMenu } from './helpers'

const IPADS = [
  { name: 'iPad mini', width: 1133, height: 744 },
  { name: 'iPad 10', width: 1180, height: 820 },
  { name: 'iPad Pro 11', width: 1194, height: 834 },
  { name: 'iPad Pro 13', width: 1366, height: 1024 },
]

async function expectFullBleed(page: Page, selector: string): Promise<void> {
  const gap = await page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.bottom,
    }
  }, selector)
  expect(gap, selector).not.toBeNull()
  for (const side of Object.values(gap!)) expect(side).toBeLessThanOrEqual(0.5)
}

for (const ipad of IPADS) {
  test.describe(ipad.name, () => {
    test.use({ viewport: { width: ipad.width, height: ipad.height } })

    test('welcome: фон на весь экран, сова ≈40% высоты', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('.screen--welcome')).toBeVisible({ timeout: 30_000 })
      await expectFullBleed(page, '#app')
      await expectFullBleed(page, '.welcome__atmosphere')
      const owl = page.locator('.welcome__olli-open')
      await expect
        .poll(() => owl.evaluate((el: HTMLImageElement) => el.complete && el.naturalHeight > 0), {
          timeout: 20_000,
        })
        .toBe(true)
      const owlShare = await owl.evaluate((el) => el.getBoundingClientRect().height / window.innerHeight)
      expect(owlShare).toBeGreaterThan(0.34)
      expect(owlShare).toBeLessThan(0.46)
    })

    test('лопни шарик: большой примерно вдвое больше маленького', async ({ page }) => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await openGame(page, 'balloon-pop')
        await expect(page.locator('.balloon-pop__balloon').first()).toBeVisible()
        const ratio = await page.evaluate(() => {
          const size = (sel: string) => {
            const el = document.querySelector<HTMLElement>(sel)
            return el ? el.getBoundingClientRect() : null
          }
          const lg = size('.balloon-pop__balloon--lg .balloon-pop__balloon-art')
          const sm = size('.balloon-pop__balloon--sm .balloon-pop__balloon-art')
          if (!lg || !sm) return null
          return Math.min(lg.width / sm.width, lg.height / sm.height)
        })
        if (ratio == null) continue
        expect(ratio).toBeGreaterThanOrEqual(1.85)
        return
      }
      throw new Error('на поле не нашлось одновременно большого и маленького шарика')
    })

    test('меню и игры заполняют экран без полосы снизу', async ({ page }) => {
      test.setTimeout(60_000)
      await openMenu(page)
      await expectFullBleed(page, '.app-shell--menu')
      for (const gameId of ['balloon-pop', 'sound-world', 'drawing', 'sort-colors', 'puzzle']) {
        await openGame(page, gameId)
        await expectFullBleed(page, '.app-shell')
      }
    })

    test('куда положить: ящики, куча и сова не налезают друг на друга', async ({ page }) => {
      await openGame(page, 'sort-colors')
      await expect(page.locator('.sort-colors__pile .sort-colors__toy')).toHaveCount(12)
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const owl = document.querySelector<HTMLImageElement>('.sort-colors .game-presenter__art')
              return Boolean(owl?.complete && owl.naturalHeight > 0)
            }),
          { timeout: 20_000 },
        )
        .toBe(true)
      await expectFullBleed(page, '.sort-colors__bg')
      const geo = await page.evaluate(() => {
        const rect = (el: Element) => el.getBoundingClientRect()
        const bar = rect(document.querySelector('.sort-colors__game-bar .game-chrome-btn')!)
        const bins = [...document.querySelectorAll('.sort-colors__bin')].map(rect)
        const toys = [...document.querySelectorAll<HTMLElement>('.sort-colors__pile .sort-colors__toy')].map((el) => {
          const r = rect(el)
          const half = el.offsetWidth / 2
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          return { left: cx - half, right: cx + half, top: cy - half, bottom: cy + half, width: half * 2 }
        })
        const owl = rect(document.querySelector('.sort-colors .game-presenter__art')!)
        const speech = rect(document.querySelector('.sort-colors .game-presenter__speech')!)
        return {
          vw: window.innerWidth,
          vh: window.innerHeight,
          barBottom: bar.bottom,
          binsTop: Math.min(...bins.map((b) => b.top)),
          binsBottom: Math.max(...bins.map((b) => b.bottom)),
          binWidth: bins[0]!.width,
          speechTop: speech.top,
          speechRight: speech.right,
          binsLeft: Math.min(...bins.map((b) => b.left)),
          toysLeft: Math.min(...toys.map((t) => t.left)),
          toysRight: Math.max(...toys.map((t) => t.right)),
          toysTop: Math.min(...toys.map((t) => t.top)),
          toysBottom: Math.max(...toys.map((t) => t.bottom)),
          toyWidth: toys[0]!.width,
          owlRight: owl.right,
          owlShare: owl.height / window.innerHeight,
        }
      })
      expect(geo.binsTop).toBeGreaterThan(geo.barBottom)
      expect(geo.binWidth).toBeGreaterThan(geo.vh * 0.22)
      expect(geo.toysTop).toBeGreaterThanOrEqual(geo.binsBottom - 4)
      expect(geo.toysBottom).toBeLessThanOrEqual(geo.vh)
      expect(geo.toysRight).toBeLessThanOrEqual(geo.vw)
      expect(geo.toysLeft).toBeGreaterThanOrEqual(geo.owlRight - 8)
      expect(geo.toyWidth).toBeGreaterThan(geo.vh * 0.1)
      expect(geo.owlShare).toBeGreaterThan(0.15)
      const speechUnderBins = geo.speechTop >= geo.binsBottom - 4 || geo.speechRight <= geo.binsLeft
      expect(speechUnderBins).toBe(true)
    })

    for (const count of [4, 9]) {
      test(`собери пазл (${count}): большая доска слева, кусочки на столе справа и не налезают`, async ({ page }) => {
        await page.addInitScript((n) => {
          const key = 'meow-planet.settings'
          const cur = JSON.parse(localStorage.getItem(key) || '{}')
          localStorage.setItem(key, JSON.stringify({ ...cur, puzzlePieceCount: n }))
        }, count)
        await openGame(page, 'puzzle')
        await page.locator('.puzzle__card').first().click()
        await expect(page.locator('.puzzle__table .puzzle__piece')).toHaveCount(count)
        await page.locator('.puzzle__table').evaluate(async (table) => {
          const settled = Promise.allSettled(table.getAnimations({ subtree: true }).map((a) => a.finished))
          await Promise.race([settled, new Promise((resolve) => setTimeout(resolve, 3000))])
        })
        await expectFullBleed(page, '.puzzle__bg')
        const geo = await page.evaluate(() => {
          const rect = (el: Element) => el.getBoundingClientRect()
          const bar = rect(document.querySelector('.puzzle__bar .game-chrome-btn')!)
          const tools = rect(document.querySelector('.puzzle__bar-tools')!)
          const board = rect(document.querySelector('.puzzle__board')!)
          const slotW = rect(document.querySelector('.puzzle__slot')!).width
          const pieces = [...document.querySelectorAll<HTMLElement>('.puzzle__table .puzzle__piece')].map((el) => {
            const r = rect(el)
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            return { cx, cy, w: el.offsetWidth, h: el.offsetHeight, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
          })
          let worstOverlap = 0
          for (let i = 0; i < pieces.length; i += 1) {
            for (let j = i + 1; j < pieces.length; j += 1) {
              const a = pieces[i]!
              const b = pieces[j]!
              const ox = Math.max(0, Math.min(a.cx + a.w / 2, b.cx + b.w / 2) - Math.max(a.cx - a.w / 2, b.cx - b.w / 2))
              const oy = Math.max(0, Math.min(a.cy + a.h / 2, b.cy + b.h / 2) - Math.max(a.cy - a.h / 2, b.cy - b.h / 2))
              worstOverlap = Math.max(worstOverlap, (ox * oy) / (a.w * a.h))
            }
          }
          return {
            vw: window.innerWidth,
            vh: window.innerHeight,
            barBottom: Math.max(bar.bottom, tools.bottom),
            board,
            slotW,
            pieceW: pieces[0]!.w,
            piecesLeft: Math.min(...pieces.map((p) => p.left)),
            piecesRight: Math.max(...pieces.map((p) => p.right)),
            piecesTop: Math.min(...pieces.map((p) => p.top)),
            piecesBottom: Math.max(...pieces.map((p) => p.bottom)),
            worstOverlap,
          }
        })
        expect(geo.board.top).toBeGreaterThan(geo.barBottom)
        expect(geo.board.width).toBeGreaterThan(geo.vw * 0.55)
        expect(geo.board.bottom).toBeLessThanOrEqual(geo.vh)
        expect(geo.piecesLeft).toBeGreaterThan(geo.board.right)
        expect(geo.piecesRight).toBeLessThanOrEqual(geo.vw)
        expect(geo.piecesTop).toBeGreaterThan(geo.barBottom - 8)
        expect(geo.piecesBottom).toBeLessThanOrEqual(geo.vh)
        expect(geo.pieceW).toBeLessThan(geo.slotW)
        expect(geo.pieceW).toBeGreaterThan(geo.slotW * (count === 4 ? 0.58 : 0.5))
        expect(geo.worstOverlap).toBeLessThan(0.1)
      })
    }
  })
}
