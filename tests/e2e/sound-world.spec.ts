import { expect, test } from '@playwright/test'
import { openGame } from './helpers'

test.describe('Изучаем звuки — вкладки без подкатегорий', () => {
  test('животные: 6 карточек и три страницы', async ({ page }) => {
    await openGame(page, 'sound-world')
    await page.getByRole('tab', { name: 'Животные' }).click()
    await expect(page.locator('.sound-world__card')).toHaveCount(6)
    const catArt = page.locator('[data-card-id="cat"] img.sound-world__art')
    // У картинки нет размеров, пока она не загрузилась: ждём загрузку, а не таймаут видимости.
    await expect
      .poll(() => catArt.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)), {
        timeout: 15000,
      })
      .toBeGreaterThan(0)
    await expect(catArt).toBeVisible()
    await expect(page.locator('.sound-world__bar-start .sound-world__pager')).toHaveCount(1)
    await expect(page.locator('[data-card-id="cat"] .sound-world__label')).toHaveText('Кошка')
    await page.getByRole('button', { name: 'Страница 2' }).click()
    await expect(page.locator('[data-card-id="sheep"]')).toBeVisible()
    await expect(page.locator('.sound-world__card')).toHaveCount(6)
    await page.getByRole('button', { name: 'Страница 3' }).click()
    await expect(page.locator('[data-card-id="lion"]')).toBeVisible()
  })

  test('ABC через pill под «Буквы»', async ({ page }) => {
    await openGame(page, 'sound-world')
    await page.getByRole('tab', { name: 'Буквы' }).click()
    await expect(page.locator('.sound-world__card--letter')).toHaveCount(33)
    await expect(page.locator('.sound-world__letter-lang')).toBeVisible()
    await page.getByRole('button', { name: 'ABC' }).click()
    await expect(page.locator('.sound-world__card--letter')).toHaveCount(26)
  })

  test('инструменты: пять карточек на одном экране', async ({ page }) => {
    await openGame(page, 'sound-world')
    await page.getByRole('tab', { name: 'Инструменты' }).click()
    await expect(page.locator('.sound-world__card')).toHaveCount(5)
    await expect(page.locator('.sound-world__grid--instruments')).toBeVisible()
    await expect(page.locator('.sound-world__page-dot')).toHaveCount(0)
  })
})
