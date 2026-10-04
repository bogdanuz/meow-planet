import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const root = (page: Page) => page.locator('.meow-home')
const speech = (page: Page) => page.locator('.meow-home .mh__say-text')
const hero = (page: Page) => page.locator('.meow-home .mh__hero')
const doll = (page: Page) => page.locator('.meow-home .mh__doll')

async function goTo(page: Page, room: 'bath' | 'kitchen' | 'bedroom' | 'yard'): Promise<void> {
  await page.locator(`[data-role="door-${room}"]`).click()
  await expect(root(page)).toHaveAttribute('data-room', room)
}

// «В гости» на доработке и закрыт заглушкой (решение владельца 03.10.2026, BACKLOG).
// Вернуть `test.describe`, когда игра снова войдёт в RELEASED_GAME_IDS.
test.describe.skip('В гости', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'meow-planet.settings'
      const cur = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(
        key,
        JSON.stringify({ ...cur, schemaVersion: 3, meowHomeRealTime: false, meowHomeSeasonByDate: false }),
      )
    })
    await openGame(page, 'meow-home')
    await expect(root(page)).toHaveAttribute('data-room', 'hall')
  })

  test('без заглушки: шапка S16, прихожая днём, двери с табличками, вешалка', async ({ page }) => {
    await expect(page.locator('.coming-soon')).toHaveCount(0)
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(page.locator('.mh__bar-tools > :last-child')).toHaveAttribute('aria-label', 'Настройки')
    await expect(page.locator('.mh__bg')).toHaveAttribute('src', /assets\/games\/meow-home\/bg\/hall-day\.webp/)
    await expect(page.locator('.mh__bg')).toHaveJSProperty('complete', true, { timeout: 15000 })
    for (const room of ['bath', 'kitchen', 'bedroom', 'yard']) {
      await expect(page.locator(`[data-role="door-${room}"]`)).toBeVisible()
    }
    await expect(page.locator('.mh__rack-item')).toHaveCount(10)
    await expect(speech(page)).toContainText(/Привет|Ура/)
  })

  test('кухня: перетащил кашу на персонажа — ест, потом испачкался; салфетка — чисто', async ({ page }) => {
    await goTo(page, 'kitchen')
    const food = (await page.locator('[data-prop="porridge"]').boundingBox())!
    const target = (await page.locator('.mh__hit').boundingBox())!
    await page.mouse.move(food.x + food.width / 2, food.y + food.height / 2)
    await page.mouse.down()
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(hero(page)).toHaveAttribute('data-action', 'eat')
    await expect(hero(page)).toHaveAttribute('data-action', 'messy', { timeout: 6000 })
    await expect(page.locator('[data-prop="napkin"]')).toHaveClass(/is-glow/)
    await page.locator('[data-prop="napkin"]').click()
    await expect(hero(page)).not.toHaveAttribute('data-action', 'messy', { timeout: 6000 })
  })

  test('спальня: кроватка — спит, темнеет; тап — просыпается', async ({ page }) => {
    await goTo(page, 'bedroom')
    await page.locator('[data-prop="bed"]').click()
    await expect(root(page)).toHaveAttribute('data-sleep', '1')
    await page.locator('[data-prop="bed"]').click()
    await expect(root(page)).not.toHaveAttribute('data-sleep', '1')
    await expect(hero(page)).toHaveAttribute('data-action', 'wake')
  })

  test('двор: зима — холодно, корзинка — шапка; летом дождик — зонтик', async ({ page }) => {
    await goTo(page, 'yard')
    await expect(page.locator('[data-role="season"]')).toBeVisible()
    await page.locator('[data-role="season"]').click()
    await page.locator('.mh__season-choice[data-season="winter"]').click()
    await expect(page.locator('.mh__bg')).toHaveAttribute('src', /yard-winter-day\.webp/)
    await expect(doll(page)).toHaveAttribute('data-mood', 'cold', { timeout: 6000 })
    await page.locator('[data-role="basket"]').click()
    await page.locator('.mh__wear[data-wear="hat"]').click()
    await expect(doll(page)).toHaveAttribute('data-outfit', /hat/)

    await page.locator('[data-role="season"]').click()
    await page.locator('.mh__season-choice[data-season="summer"]').click()
    await page.locator('[data-role="precip"]').click()
    await expect(page.locator('.mh__weather')).toBeVisible()
    await expect(doll(page)).toHaveAttribute('data-mood', 'wet', { timeout: 6000 })
    const basketOpen = await page.locator('.mh__basket-pop').isVisible()
    if (!basketOpen) await page.locator('[data-role="basket"]').click()
    await page.locator('.mh__wear[data-wear="umbrella"]').click()
    await expect(doll(page)).toHaveAttribute('data-outfit', /umbrella/)
    await page.locator('[data-role="back"]').click()
    await expect(root(page)).toHaveAttribute('data-room', 'hall')
  })

  test('шестерёнка → раздел «В гости» в настройках → «Назад в игру»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.settings-page[data-section="meow-home"]')).toBeVisible()
    await expect(page.locator('#meow-home-wishes')).toBeAttached()
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(root(page)).toBeVisible()
  })
})
