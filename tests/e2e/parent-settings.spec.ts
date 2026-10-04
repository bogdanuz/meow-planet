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

  test('настройки на весь экран: разделы слева, пункты раздела справа', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    const nav = page.locator('.settings-nav')
    await expect(nav.getByRole('tab', { name: 'Общее' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#music-enabled')).toBeVisible()
    await expect(page.locator('#puzzle-pieces')).toBeHidden()
    await nav.getByRole('tab', { name: 'Собери пазл' }).click()
    await expect(page.locator('#puzzle-pieces')).toBeVisible()
    await expect(page.locator('#music-enabled')).toBeHidden()
    const geo = await page.evaluate(() => {
      const form = document.querySelector('.settings-form')!.getBoundingClientRect()
      return { formW: form.width, vw: window.innerWidth }
    })
    expect(geo.formW).toBeGreaterThan(geo.vw * 0.85)
  })

  test('вкладка «Об играх»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await page.getByRole('tab', { name: 'Об играх' }).click()
    await expect(page.locator('.parent-about__item')).toHaveCount(9)
    await expect(page.locator('.parent-about__title', { hasText: 'Лопни шарик' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Что происходит для ребёнка' }).first()).toBeVisible()

    const host = page.locator('.parent-about-host')
    const fits = await host.evaluate((el) => el.scrollHeight <= el.clientHeight)
    expect(fits).toBe(false)
    await host.hover()
    await page.mouse.wheel(0, 800)
    await expect.poll(() => host.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    await host.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect(page.locator('.parent-about__note')).toBeInViewport()
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
