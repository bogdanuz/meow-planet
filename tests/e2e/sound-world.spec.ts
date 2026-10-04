import { expect, test } from '@playwright/test'
import { openGame } from './helpers'

test.describe('Изучаем звуки — вкладки без подкатегорий', () => {
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

  test('пианино и маракасы: два пальца одновременно', async ({ page }) => {
    await openGame(page, 'sound-world')
    await page.getByRole('tab', { name: 'Инструменты' }).click()
    await page.locator('[data-card-id="piano"]').click()
    await expect(page.locator('.sound-world__piano-key')).toHaveCount(7)

    const pressed = await page.evaluate(() => {
      const scene = document.querySelector<HTMLElement>('.sound-world__piano-scene')!
      const keys = [...document.querySelectorAll<HTMLElement>('.sound-world__piano-key')]
      const down = (key: HTMLElement, pointerId: number): void => {
        const r = key.getBoundingClientRect()
        scene.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            pointerId,
            pointerType: 'touch',
            isPrimary: pointerId === 1,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height * 0.8,
          }),
        )
      }
      down(keys[0]!, 1)
      down(keys[4]!, 2)
      return document.querySelectorAll('.sound-world__piano-key.is-pressed').length
    })
    expect(pressed).toBe(2)

    await page.getByRole('button', { name: 'К инструментам' }).click()
    await page.locator('[data-card-id="maracas"]').click()
    const shaking = await page.evaluate(() => {
      const maracas = [...document.querySelectorAll<HTMLElement>('.sound-world__maraca')]
      maracas.forEach((maraca, index) => {
        const r = maraca.getBoundingClientRect()
        maraca.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            pointerId: index + 1,
            pointerType: 'touch',
            isPrimary: index === 0,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
          }),
        )
      })
      return document.querySelectorAll('.sound-world__maraca.is-shake').length
    })
    expect(shaking).toBe(2)
  })
})
