import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const root = (page: Page) => page.locator('.counting')
const speech = (page: Page) => page.locator('.counting .game-presenter__speech')
const rugToys = (page: Page) => page.locator('.counting__rug .counting__toy')

async function dragToBox(page: Page): Promise<void> {
  const toy = (await rugToys(page).first().boundingBox())!
  const box = (await page.locator('.counting__box').first().boundingBox())!
  await page.mouse.move(toy.x + toy.width / 2, toy.y + toy.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
}

test.describe('Учимся считать', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'meow-planet.settings'
      const cur = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({ ...cur, schemaVersion: 3, countingLimit: 3 }))
      localStorage.removeItem('meow-planet.counting-toy')
    })
    await openGame(page, 'counting')
    await expect(root(page)).toHaveAttribute('data-mode', 'free')
  })

  test('без заглушки: шапка S16, фон, ящик, коврик и цифры 1–3', async ({ page }) => {
    await expect(page.locator('.coming-soon')).toHaveCount(0)
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(page.locator('.counting__bar-tools > :last-child')).toHaveAttribute('aria-label', 'Настройки')
    await expect(page.locator('.counting__bg')).toHaveAttribute('src', /assets\/games\/counting\/counting-bg\.webp/)
    await expect(root(page)).toHaveAttribute('data-toy', 'cube')
    await expect(rugToys(page)).toHaveCount(3)
    await expect(page.locator('.counting__digit')).toHaveCount(3)
    await expect(page.locator('.counting__digit img').first()).toHaveJSProperty('complete', true, { timeout: 15000 })
    await expect(speech(page)).toContainText('Давай считать!')
  })

  test('перетащил и нажал — в ящике растёт число, цифра на ящике; все в ящике — праздник', async ({ page }) => {
    await dragToBox(page)
    await expect(root(page)).toHaveAttribute('data-count', '1')
    await expect(speech(page)).toContainText('Один кубик!')
    await expect(page.locator('.counting__box-digit')).toHaveAttribute('src', /digits\/1\.png/)
    await rugToys(page).first().click()
    await expect(root(page)).toHaveAttribute('data-count', '2')
    await expect(speech(page)).toContainText('Два кубика!')
    await rugToys(page).first().click()
    await expect(root(page)).toHaveAttribute('data-count', '3')
    await expect(speech(page)).toContainText('Все кубики в ящике!', { timeout: 8000 })
  })

  test('все в ящике и сразу достал одну — праздника за «три» нет', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) await rugToys(page).first().click()
    await expect(speech(page)).toContainText('Все кубики в ящике!', { timeout: 8000 })
    await page.locator('.counting__box-inside .counting__toy').first().click()
    await expect(root(page)).toHaveAttribute('data-count', '2')
    await page.waitForTimeout(4000)
    await expect(speech(page)).not.toContainText('Три кубика')
    await expect(root(page)).not.toHaveClass(/is-party/)
  })

  test('«Задание»: положил нужное и сразу нажал ящик — похвала без пересчёта', async ({ page }) => {
    test.setTimeout(60_000)
    await page.getByRole('button', { name: 'Задание' }).click()
    await expect(root(page)).toHaveAttribute('data-task', 'give')
    const target = Number(await root(page).getAttribute('data-target'))
    await expect(speech(page)).toContainText('Положи в ящик', { timeout: 8000 })
    await page.evaluate(() => {
      const el = document.querySelector('.counting .game-presenter__speech')!
      const seen: string[] = []
      ;(window as unknown as { __speech: string[] }).__speech = seen
      new MutationObserver(() => seen.push(el.textContent ?? '')).observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    })
    for (let i = 0; i < target; i += 1) await rugToys(page).first().click()
    await page.locator('.counting__box-hit').first().dispatchEvent('click')
    await expect(root(page)).toHaveAttribute('data-task', 'count', { timeout: 15000 })
    const seen = await page.evaluate(() => (window as unknown as { __speech: string[] }).__speech)
    expect(seen).not.toContain('Один')
    expect(seen.some((t) => /Молодец|Правильно|Ура|Здорово|Умница|Вот это да/.test(t))).toBe(true)
  })

  test('достал из ящика — «Было два, стало один»; цифра внизу называет число', async ({ page }) => {
    await rugToys(page).first().click()
    await rugToys(page).first().click()
    await expect(root(page)).toHaveAttribute('data-count', '2')
    await page.locator('.counting__box-inside .counting__toy').first().click()
    await expect(root(page)).toHaveAttribute('data-count', '1')
    await expect(speech(page)).toContainText('остался один')
    await page.locator('.counting__digit[data-n="3"]').click()
    await expect(speech(page)).toHaveText('Три')
  })

  test('«Игрушки» меняет вид игрушек и запоминает выбор', async ({ page }) => {
    await page.getByRole('button', { name: 'Игрушки' }).click()
    await expect(page.locator('.counting__toys-choice')).toHaveCount(7)
    await page.locator('.counting__toys-choice[data-kind="star"]').click()
    await expect(root(page)).toHaveAttribute('data-toy', 'star')
    await expect(rugToys(page).first()).toHaveAttribute('data-kind', 'star')
    await expect(speech(page)).toContainText('звёздочки')
    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await page.locator('[data-game-id="counting"]').click()
    await expect(root(page)).toHaveAttribute('data-toy', 'star')
    await expect(rugToys(page).first()).toHaveAttribute('data-kind', 'star')
  })

  test('«Задание»: «Положи в ящик N» — положил сколько нужно, похвала и следующее', async ({ page }) => {
    test.setTimeout(60_000)
    await page.getByRole('button', { name: 'Задание' }).click()
    await expect(root(page)).toHaveAttribute('data-mode', 'task')
    await expect(page.getByRole('button', { name: 'Подсказка' })).toBeVisible()
    await expect(root(page)).toHaveAttribute('data-task', 'give')
    const target = Number(await root(page).getAttribute('data-target'))
    await expect(speech(page)).toContainText('Положи в ящик', { timeout: 8000 })
    for (let i = 0; i < target; i += 1) await rugToys(page).first().click()
    await expect(speech(page)).toContainText(/Молодец|Правильно|Ура|Здорово|Умница|Вот это да/, { timeout: 10000 })
    await expect(root(page)).toHaveAttribute('data-task', 'count', { timeout: 15000 })
  })

  test('шестерёнка → раздел «Учимся считать» в настройках → «Назад в игру»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.settings-page[data-section="counting"]')).toBeVisible()
    await expect(page.locator('#counting-limit')).toBeVisible()
    await expect(page.locator('#counting-task-compare')).toBeVisible()
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(root(page)).toBeVisible()
  })
})
