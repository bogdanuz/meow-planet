import { expect, test } from '@playwright/test'
import { openMenu } from './helpers'

const TILE_GAMES = [
  'balloon-pop',
  'sound-world',
  'sort-colors',
  'puzzle',
  'shape-build',
  'hide-seek',
  'seasons',
  'counting',
] as const

test.describe('меню плиток (S13 / M3.5)', () => {
  test('плитки и поле Мяу разделены и не пересекаются на iPad landscape', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 1194, height: 834 },
      { width: 1366, height: 1024 },
    ]) {
      await page.setViewportSize(viewport)
      await openMenu(page)
      await page.locator('.screen--menu').evaluate(async (menu) => {
        await Promise.all(menu.getAnimations().map((animation) => animation.finished))
      })

      const geometry = await page.evaluate(() => {
        const games = document.querySelector<HTMLElement>('.menu-layout__games')!
        const presenter = document.querySelector<HTMLElement>('.menu-presenter')!
        const grid = document.querySelector<HTMLElement>('.menu-grid')!
        const stack = document.querySelector<HTMLElement>('.menu-visit-stack')!
        const cat = document.querySelector<HTMLElement>('.menu-visit-cat__anchor')!
        const firstTile = document.querySelector<HTMLElement>('.game-tile')!
        const back = document.querySelector<HTMLElement>('.menu-back')!
        const gamesRect = games.getBoundingClientRect()
        const presenterRect = presenter.getBoundingClientRect()
        const gridRect = grid.getBoundingClientRect()
        const stackRect = stack.getBoundingClientRect()
        const catRect = cat.getBoundingClientRect()
        const tileRect = firstTile.getBoundingClientRect()
        const backRect = back.getBoundingClientRect()
        const gamesStyle = getComputedStyle(games)
        const overlapWidth = Math.max(
          0,
          Math.min(tileRect.right, backRect.right) -
            Math.max(tileRect.left, backRect.left),
        )
        const overlapHeight = Math.max(
          0,
          Math.min(tileRect.bottom, backRect.bottom) -
            Math.max(tileRect.top, backRect.top),
        )
        return {
          gamesRight: gamesRect.right,
          presenterLeft: presenterRect.left,
          gridLeft: gridRect.left,
          stackLeft: stackRect.left,
          stackRight: stackRect.right,
          presenterRight: presenterRect.right,
          presenterTop: presenterRect.top,
          presenterBottom: presenterRect.bottom,
          catTop: catRect.top,
          stackBottom: stackRect.bottom,
          backTileOverlapArea: overlapWidth * overlapHeight,
          separatorWidth: Number.parseFloat(gamesStyle.borderRightWidth),
        }
      })

      expect(geometry.gamesRight).toBeLessThanOrEqual(geometry.presenterLeft)
      expect(geometry.stackLeft).toBeGreaterThanOrEqual(geometry.presenterLeft)
      expect(geometry.stackRight).toBeLessThanOrEqual(
        geometry.presenterRight + 1,
      )
      expect(geometry.gridLeft).toBeGreaterThanOrEqual(16)
      expect(geometry.separatorWidth).toBeGreaterThanOrEqual(2)
      expect(geometry.catTop).toBeGreaterThanOrEqual(geometry.presenterTop)
      expect(geometry.stackBottom).toBeLessThanOrEqual(
        geometry.presenterBottom + 1,
      )
      expect(geometry.backTileOverlapArea).toBe(0)

      const lastTile = page.locator('.menu-grid .game-tile').last()
      await lastTile.scrollIntoViewIfNeeded()
      await expect(lastTile).toBeVisible()
    }
  })

  test('приветствие → Играть → 8 плиток + «В гости» у Мяу', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.screen--welcome')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.welcome__title')).toHaveAttribute('alt', 'Планета Мяу')
    await page.getByRole('button', { name: 'Играть' }).click()
    await expect(page.locator('.menu-grid')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.menu-grid .game-tile')).toHaveCount(8)
    await expect(page.locator('.menu-visit-bed__meow')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'В гостях у Мяу' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Настройки' })).toBeVisible()
    for (const gameId of TILE_GAMES) {
      await expect(page.locator(`.game-tile[data-game-id="${gameId}"]`)).toBeVisible()
    }
    await expect(page.locator('.menu-visit-bed[data-game-id="meow-home"]')).toBeVisible()

    const menu = page.locator('.screen--menu')
    const box = await menu.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height * 0.5
    await page.mouse.move(box!.x + 10, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 130, y, { steps: 8 })
    await page.mouse.up()
    await expect(page.locator('.screen--welcome')).toBeVisible()
  })

  test('В гостях у Мяу пока заглушка', async ({ page }) => {
    await openMenu(page)
    await page.getByRole('button', { name: 'В гостях у Мяу' }).click()
    await expect(page.locator('.coming-soon')).toBeVisible()
    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await expect(page.locator('.menu-grid')).toBeVisible()
  })

  test('меню → игра → назад → заглушка недоделанной', async ({ page }) => {
    await openMenu(page)
    await page.locator('[data-game-id="balloon-pop"]').click()
    await expect(page.locator('.balloon-pop[data-game-id="balloon-pop"]')).toBeVisible()

    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await expect(page.locator('.menu-grid')).toBeVisible()
  })
})
