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
