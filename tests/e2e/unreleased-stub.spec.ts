import { test } from '@playwright/test'
import { expectComingSoon, openGame } from './helpers'

/** «В гости» на доработке (решение владельца 03.10.2026): кнопка у Мяу открывает заглушку. */
const UNRELEASED = ['meow-home'] as const

test.describe('заглушка невыпущенных игр', () => {
  for (const id of UNRELEASED) {
    test(`${id} открывает заглушку`, async ({ page }) => {
      await openGame(page, id)
      await expectComingSoon(page)
    })
  }
})
