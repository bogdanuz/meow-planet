import { expect, test } from '@playwright/test'
import { openGame } from './helpers'

async function openBalloonPop(page: import('@playwright/test').Page): Promise<void> {
  await openGame(page, 'balloon-pop')
  await expect(page.locator('.balloon-pop')).toBeVisible()
  await expect(page.locator('.balloon-pop__game-bar')).toBeVisible()
}

test.describe('Лопни шарик (S04)', () => {
  test('небо, шарики-картинки, Мяу и иконки chrome', async ({ page }) => {
    await openBalloonPop(page)
    await expect(page.locator('.balloon-pop__sky')).toBeVisible()
    await expect(page.locator('.balloon-pop__sky-art')).toBeVisible()
    await expect(page.locator('.balloon-pop__title')).toHaveCount(0)
    await expect(page.locator('.balloon-pop h2')).toHaveCount(0)
    await expect(page.locator('.balloon-pop__balloon-art')).toHaveCount(8)
    await expect(page.locator('.balloon-pop__meow:not(.is-pose-under)')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Назад в меню' }).locator('img.ui-icon'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Звук/ }).locator('img.ui-icon'),
    ).toBeVisible()
    const sound = page.getByRole('button', { name: /Звук/ })
    await expect(sound).toHaveAttribute('aria-label', /Звук/)
    await sound.click()
    await expect(sound).toHaveAttribute('aria-label', /Звук/)
    await expect(page.getByRole('button', { name: 'На welcome' })).toHaveCount(0)
  })

  test('свободный режим: любой шарик лопается', async ({ page }) => {
    await openBalloonPop(page)
    await expect(page.locator('.balloon-pop')).toHaveAttribute('data-mode', 'free')

    // Последний в DOM — сверху по z-order; .first() часто под перекрытием крупного шара
    const target = page.locator('.balloon-pop__balloon').last()
    const id = await target.getAttribute('data-balloon-id')
    await target.click({ force: true })
    await expect(target).toHaveClass(/is-popping/, { timeout: 1500 })
    await expect(page.locator('.balloon-pop__speech')).toContainText(
      /Ура|Давай|Здорово|Отлично|Продолжай/i,
    )

    // После анимации лопнувший шар убирается, остальные на месте
    await expect(
      page.locator(`.balloon-pop__balloon[data-balloon-id="${id}"]`),
    ).toHaveCount(0, { timeout: 5000 })
    await expect(page.locator('.balloon-pop__balloon')).toHaveCount(7)
  })

  test('режим задания: неверный цвет — подсказка, шарик остаётся', async ({
    page,
  }) => {
    await openBalloonPop(page)
    await page.getByRole('button', { name: /Задание/i }).click()

    let hint = ''
    for (let i = 0; i < 14; i += 1) {
      await page.getByRole('button', { name: /Задание/i }).click()
      hint = (await page.locator('.balloon-pop__speech').textContent()) ?? ''
      if (
        /(?:Лопни|Давай лопнем) (красный|оранжевый|жёлтый|зелёный|фиолетовый)/.test(
          hint,
        )
      ) {
        break
      }
    }
    await expect(page.locator('.balloon-pop')).toHaveAttribute('data-mode', 'task')
    expect(hint).toMatch(/(?:Лопни|Давай лопнем) .+ шарик/i)

    const targetColorMatch = hint.match(
      /(?:Лопни|Давай лопнем) (красный|оранжевый|жёлтый|зелёный|фиолетовый)/,
    )
    const colorMap: Record<string, string> = {
      красный: 'red',
      оранжевый: 'orange',
      жёлтый: 'yellow',
      зелёный: 'green',
      фиолетовый: 'violet',
    }
    const want = targetColorMatch
      ? colorMap[targetColorMatch[1]!]
      : undefined

    let balloon = page.locator('.balloon-pop__balloon').first()
    if (want) {
      const other = page.locator(`.balloon-pop__balloon:not([data-color="${want}"])`).first()
      if (await other.count()) balloon = other
    }

    const id = await balloon.getAttribute('data-balloon-id')
    const tappedColor = await balloon.getAttribute('data-color')
    await balloon.click({ force: true })

    if (want && tappedColor !== want) {
      await expect(page.locator('.balloon-pop__speech')).toContainText(
        /другой|Попробуй|Лопни|Давай лопнем/i,
      )
      await expect(
        page.locator(`.balloon-pop__balloon[data-balloon-id="${id}"]`),
      ).toHaveCount(1)
      const wrongBalloons = page.locator(
        `.balloon-pop__balloon:not([data-color="${want}"])`,
      )
      await expect(wrongBalloons).toHaveCount(4)
      await wrongBalloons.nth(0).click({ force: true })
      await wrongBalloons.nth(1).click({ force: true })
      await wrongBalloons.nth(2).click({ force: true })
      const highlighted = page.locator(
        '.balloon-pop__balloon.is-soft-highlight',
      ).first()
      await expect(highlighted).toHaveAttribute('data-color', want, { timeout: 10000 })
      await expect(highlighted.locator('.balloon-pop__glow').first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    await expect(
      page.locator(`.balloon-pop__balloon[data-balloon-id="${id}"]`),
    ).toHaveCount(0, { timeout: 2000 })
  })
})
