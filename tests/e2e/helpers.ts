import { expect, type Page } from '@playwright/test'

/** Открыть меню плиток, минуя приветствие (для тестов игр). */
export async function openMenu(page: Page): Promise<void> {
  await page.goto('/#/menu', { waitUntil: 'domcontentloaded' })
  // Меню появляется только после boot-последовательности (precache ассетов).
  // `load` может не наступить из-за динамических ресурсных запросов,
  // поэтому ждём именно снятия boot-loader.
  const loader = page.locator('.boot-loader')
  await loader
    .waitFor({ state: 'detached', timeout: 30000 })
    .catch(() => undefined)
  await expect(page.locator('.menu-grid')).toBeVisible({ timeout: 5000 })
  // В отдельных прогонах menu-grid может появиться раньше, чем смонтируется кнопка
  // «Настройки» (она абсолютная и может задержаться из-за очередей рендера/анимаций).
  // Подождём её явно, чтобы тесты не ловили тайминговые гонки.
  await expect(page.getByRole('button', { name: 'Настройки' })).toBeVisible({
    timeout: 5000,
  })
}

export async function openGame(
  page: Page,
  gameId: string,
): Promise<void> {
  await openMenu(page)
  await page.locator(`[data-game-id="${gameId}"]`).click()
}

export async function expectComingSoon(page: Page): Promise<void> {
  await expect(page.locator('.coming-soon')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
}
