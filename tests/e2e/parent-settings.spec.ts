import { expect, test } from '@playwright/test'
import { openGame, openMenu } from './helpers'

test.describe('настройки', () => {
  test.beforeEach(async ({ page }) => {
    await openMenu(page)
  })

  test('без капчи: имя сохраняется после перезагрузки', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.parent-gate')).toHaveCount(0)
    await expect(page.locator('.settings-form')).toBeVisible()

    await page.locator('#child-name').fill('Алиса')
    await page.locator('#child-name').blur()
    await expect(page.locator('#child-name')).toHaveValue('Алиса')

    await openMenu(page)
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('#child-name')).toHaveValue('Алиса')
  })

  test('вкладка «Об играх»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await page.getByRole('tab', { name: 'Об играх' }).click()
    await expect(page.locator('.parent-about__item')).toHaveCount(9)
    await expect(page.locator('.parent-about__title', { hasText: 'Лопни шарик' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Что происходит для ребёнка' }).first()).toBeVisible()
  })

  test('имя влияет на «Лопни шарик»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await page.locator('#child-name').fill('Миша')
    await page.locator('#child-name').blur()

    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await openGame(page, 'balloon-pop')

    await expect(page.locator('.balloon-pop__speech')).toContainText('Миша')
  })
})
