import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const root = (page: Page) => page.locator('.hide-seek')

async function wantedId(page: Page): Promise<string> {
  await expect(root(page)).toHaveAttribute('data-wanted', /.+/, { timeout: 10000 })
  return (await root(page).getAttribute('data-wanted'))!
}

async function tapTarget(page: Page, id: string): Promise<void> {
  await page.locator(`.hide-seek__spot[data-role="target"][data-item-id="${id}"] .hide-seek__hit`).dispatchEvent('click')
}

test.describe('Прятки', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'meow-planet.settings'
      const cur = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({ ...cur, hideSeekLevel: 'easy', hideSeekMirror: false }))
    })
    await openGame(page, 'hide-seek')
    await expect(root(page)).toHaveAttribute('data-view', 'gallery')
  })

  test('без заглушки: шапка S16 и галерея из 6 картинок', async ({ page }) => {
    await expect(page.locator('.coming-soon')).toHaveCount(0)
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(page.locator('.hide-seek__bar-tools > :last-child')).toHaveAttribute('aria-label', 'Настройки')
    await expect(page.locator('.hide-seek__card')).toHaveCount(6)
    await expect(page.locator('.hide-seek__card').first().locator('.hide-seek__card-thumb')).toHaveCSS(
      'background-image',
      /assets\/games\/hide-seek\/thumbs\/.+\.webp/,
    )
  })

  test('картинка → нашёл всех → праздник, звёздочка и «Ещё»', async ({ page }) => {
    test.setTimeout(60_000)
    await page.locator('.hide-seek__card[data-scene-id="kitchen"]').click()
    await expect(root(page)).toHaveAttribute('data-view', 'play')
    await expect(page.locator('.hide-seek__scene')).toHaveAttribute('src', /hide-seek\/scenes\/kitchen\.webp/)
    await expect(page.locator('.hide-seek__strip-card')).toHaveCount(3)

    const first = await wantedId(page)
    await expect(page.locator('.hide-seek .game-presenter')).toContainText(/Где спрятал/)
    await tapTarget(page, first)
    await expect(page.locator(`.hide-seek__strip-card[data-item-id="${first}"]`)).toHaveClass(/is-found/)

    let prev = first
    for (let i = 0; i < 2; i += 1) {
      await expect(root(page)).not.toHaveAttribute('data-wanted', prev, { timeout: 10000 })
      prev = await wantedId(page)
      await tapTarget(page, prev)
    }
    await expect(page.locator('.hide-seek__strip-card.is-found')).toHaveCount(3)
    const more = page.locator('.hide-seek__more')
    await expect(more).toBeVisible({ timeout: 25000 })
    await expect(more).toHaveAttribute('aria-label', /^Ещё: /)

    await page.locator('[data-role="gallery"]').click()
    await expect(root(page)).toHaveAttribute('data-view', 'gallery')
    await expect(page.locator('.hide-seek__card[data-scene-id="kitchen"]')).toHaveClass(/is-solved/)
  })

  test('промах по фону — мягко, задание остаётся; «Подсказка» подсвечивает', async ({ page }) => {
    await page.locator('.hide-seek__card[data-scene-id="garden"]').click()
    const id = await wantedId(page)
    const stage = (await page.locator('.hide-seek__stage').boundingBox())!
    await page.mouse.click(stage.x + stage.width * 0.5, stage.y + stage.height * 0.1)
    await expect(root(page)).toHaveAttribute('data-wanted', id)
    await page.locator('[data-role="hint"]').click()
    await expect(page.locator('.hide-seek__glow')).toHaveClass(/is-on/)
  })

  test('шестерёнка → раздел «Прятки» в настройках → «Назад в игру»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.settings-page[data-section="hide-seek"]')).toBeVisible()
    await expect(page.locator('#hide-seek-level')).toBeVisible()
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(root(page)).toBeVisible()
  })
})
