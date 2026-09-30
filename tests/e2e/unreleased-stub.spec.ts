import { test } from '@playwright/test'
import { expectComingSoon, openGame } from './helpers'

const UNRELEASED = [
  'sort-colors',
  'puzzle',
  'shape-build',
  'hide-seek',
  'meow-home',
  'counting',
] as const

test.describe('заглушка невыпущенных игр', () => {
  for (const id of UNRELEASED) {
    test(`${id} открывает заглушку`, async ({ page }) => {
      await openGame(page, id)
      await expectComingSoon(page)
    })
  }
})
