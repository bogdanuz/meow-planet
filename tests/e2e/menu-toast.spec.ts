import { expect, test } from '@playwright/test'
import { openMenu } from './helpers'

const VIEWPORTS = [
  { width: 1024, height: 768 },
  { width: 1180, height: 820 },
  { width: 1366, height: 1024 },
  { width: 1280, height: 720 },
  { width: 1000, height: 720 },
  { width: 1600, height: 720 },
  { width: 1133, height: 744 },
]

for (const companion of ['olli', 'meow'] as const) {
  test(`«Погладь меня» (${companion}) — над персонажем по центру, с отступами, под кнопками`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.addInitScript((c) => {
      const key = 'meow-planet.settings'
      const cur = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({ ...cur, companion: c }))
    }, companion)
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      await openMenu(page)
      await page
        .locator('.menu-visit-bed__meow:not(.is-under)')
        .evaluate((img: HTMLImageElement) => img.decode().catch(() => undefined))
      await page.locator('.menu-visit-bed__toast').evaluate((el) => el.classList.add('is-on'))
      await page.waitForTimeout(650)
      const g = await page.evaluate(() => {
        const rect = (s: string) => document.querySelector<HTMLElement>(s)!.getBoundingClientRect()
        const toast = rect('.menu-visit-bed__toast')
        const char = rect('.menu-visit-cat__anchor')
        const pres = rect('.menu-presenter')
        const above = [rect('.menu-sound'), rect('.menu-settings')].filter(
          (b) => b.right > toast.left && b.left < toast.right,
        )
        const ceiling = Math.max(pres.top, ...above.map((b) => b.bottom))
        return { toast, char, pres, ceiling }
      })
      const where = `${viewport.width}×${viewport.height}`
      expect(g.toast.bottom, `${where}: облачко не наезжает на голову`).toBeLessThanOrEqual(g.char.top - 3)
      expect(g.toast.top, `${where}: облачко ниже кнопок и верха поля`).toBeGreaterThanOrEqual(g.ceiling + 3)
      const toastCx = g.toast.left + g.toast.width / 2
      const charCx = g.char.left + g.char.width / 2
      expect(Math.abs(toastCx - charCx), `${where}: по центру над персонажем`).toBeLessThan(g.char.width * 0.1)
      expect(g.toast.left).toBeGreaterThanOrEqual(g.pres.left)
      expect(g.toast.right).toBeLessThanOrEqual(g.pres.right)
      expect(g.toast.width, `${where}: размер от персонажа`).toBeLessThan(g.char.width * 0.9)
      expect(g.toast.height, `${where}: облачко читаемое, не мелкое`).toBeGreaterThanOrEqual(40)
    }
  })
}
