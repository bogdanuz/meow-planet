import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const tablePieces = (page: Page) => page.locator('.puzzle__table .puzzle__piece')
const slot = (page: Page, id: string) => page.locator(`.puzzle__slot[data-slot-id="${id}"]`)

async function dragPieceTo(page: Page, pieceId: string, slotId: string): Promise<void> {
  const piece = page.locator(`.puzzle__piece[data-piece-id="${pieceId}"]`)
  const from = (await piece.boundingBox())!
  const to = (await slot(page, slotId).boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
  await page.mouse.up()
}

async function openPicture(page: Page, title: string): Promise<void> {
  await page.locator('.puzzle__card', { hasText: title }).click()
  await expect(page.locator('.puzzle')).toHaveAttribute('data-view', 'play')
}

test.describe('Собери пазл', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page, 'puzzle')
    await expect(page.locator('.puzzle')).toHaveAttribute('data-view', 'picker')
  })

  test('без заглушки: рамка S16, стол, галерея с 17 картинками; «Своё фото» и шестерёнка в шапке', async ({ page }) => {
    await expect(page.locator('.coming-soon')).toHaveCount(0)
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.locator('.puzzle .game-presenter')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(page.locator('.puzzle__bg')).toHaveAttribute('src', /creative\/desk-table\.webp/)
    await expect(page.locator('.puzzle__bar-tools .puzzle__add-photo-btn')).toBeVisible()
    await expect(page.locator('.puzzle__bar-tools > :last-child')).toHaveAttribute('aria-label', 'Настройки')
    await expect(page.locator('.puzzle__card')).toHaveCount(6)
    const titles = new Set<string>()
    for (let i = 0; i < 4; i += 1) {
      for (const t of await page.locator('.puzzle__card-title').allTextContents()) titles.add(t)
      const next = page.getByRole('button', { name: 'Следующие картинки' })
      if (await next.isDisabled()) break
      await next.click()
    }
    expect(titles.size).toBe(17)
    await expect(page.locator('.puzzle__card').first().locator('.puzzle__card-thumb')).toHaveCSS(
      'background-image',
      /assets\/games\/puzzle\/thumbs\/.+\.webp/,
    )
    expect(titles.has('Своё фото')).toBe(false)
  })

  test('шестерёнка → раздел «Собери пазл» в настройках → «Назад» обратно в пазл', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.settings-page[data-section="puzzle"]')).toBeVisible()
    await expect(page.locator('#puzzle-pieces')).toBeVisible()
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(page.locator('.puzzle')).toBeVisible()
  })

  test('своё фото: подогнал → подписал → собирается; в галерее первое; «Выбрать» → «Удалить»', async ({ page }) => {
    const png = await page.evaluate(async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#7cc4e8'
      ctx.fillRect(0, 0, 640, 480)
      ctx.fillStyle = '#f2c14e'
      ctx.fillRect(320, 0, 320, 240)
      return canvas.toDataURL('image/png').split(',')[1]!
    })
    const chooser = page.waitForEvent('filechooser')
    await page.locator('.puzzle__add-photo-btn').click()
    await (await chooser).setFiles({ name: 'cat.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
    await page.locator('[data-role="crop-done"]').click()
    const name = page.locator('[data-text-input]')
    await expect(name).toBeVisible()
    await name.fill('Кот Мурзик')
    await page.locator('[data-choice="ok"]').click()
    await expect(page.locator('.puzzle')).toHaveAttribute('data-scene', 'photo')
    await expect(tablePieces(page)).toHaveCount(4)

    await page.locator('.puzzle__gallery-btn').click()
    const first = page.locator('.puzzle__card').first()
    await expect(first).toHaveAttribute('aria-label', 'Кот Мурзик')
    await page.locator('[data-role="select-toggle"]').click()
    await first.click()
    await expect(page.locator('[data-role="delete-selected"]')).toHaveText('Удалить (1)')
    await page.locator('[data-role="delete-selected"]').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(page.locator('.puzzle__card[data-photo-id]')).toHaveCount(0)
    await expect(page.locator('[data-role="select-toggle"]')).toBeHidden()
  })

  test('картинка → 4 кусочка на столе; перетащил в свою клетку — встал', async ({ page }) => {
    await openPicture(page, 'Пирог')
    await expect(tablePieces(page)).toHaveCount(4)
    await expect(page.locator('.puzzle__slot')).toHaveCount(4)
    const id = (await tablePieces(page).first().getAttribute('data-piece-id'))!
    await dragPieceTo(page, id, id)
    await expect(slot(page, id).locator('.puzzle__piece.is-placed')).toHaveCount(1)
    await expect(tablePieces(page)).toHaveCount(3)
  })

  test('положил обратно на стол — кусочек не прыгает в доску', async ({ page }) => {
    await openPicture(page, 'Пирог')
    const piece = tablePieces(page).first()
    const from = (await piece.boundingBox())!
    const table = (await page.locator('.puzzle__table').boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(table.x + table.width * 0.7, table.y + table.height * 0.5, { steps: 10 })
    await page.mouse.up()
    await expect(tablePieces(page)).toHaveCount(4)
    await expect(page.locator('.puzzle__piece.is-placed')).toHaveCount(0)
    await expect(page.locator('.puzzle__float .puzzle__piece')).toHaveCount(0)
  })

  test('держит кусочек и открыл «Галерею» — кусочек не висит над галереей', async ({ page }) => {
    await openPicture(page, 'Пирог')
    const from = (await tablePieces(page).first().boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(from.x + 80, from.y + 40, { steps: 6 })
    await expect(page.locator('.puzzle__float .puzzle__piece')).toHaveCount(1)
    await page.locator('.puzzle__gallery-btn').dispatchEvent('click')
    await expect(page.locator('.puzzle')).toHaveAttribute('data-view', 'picker')
    await expect(page.locator('.puzzle__float .puzzle__piece')).toHaveCount(0)
    await page.mouse.up()
    await expect(page.locator('.puzzle__float .puzzle__piece')).toHaveCount(0)
  })

  test('собрал тапами → праздник → «Ещё» открывает следующую картинку', async ({ page }) => {
    await openPicture(page, 'Пирог')
    const boardBefore = (await page.locator('.puzzle__board').boundingBox())!
    const pieceBefore = (await tablePieces(page).first().boundingBox())!
    for (let i = 0; i < 4; i += 1) {
      const piece = tablePieces(page).first()
      const id = (await piece.getAttribute('data-piece-id'))!
      await piece.click()
      await slot(page, id).click()
      await expect(slot(page, id).locator('.puzzle__piece.is-placed')).toHaveCount(1)
    }
    await expect(page.locator('.puzzle__board')).toHaveClass(/is-celebrating/)
    await expect(page.locator('.puzzle__board .puzzle__board-full')).toHaveCSS('background-image', /bake/)
    const more = page.locator('.puzzle__more')
    await expect(more).toBeVisible({ timeout: 6000 })
    await expect(more).toHaveAttribute('aria-label', 'Ещё: Пикник')
    await expect(page.locator('.puzzle__play')).toHaveClass(/is-finale/)
    const vp = page.viewportSize()!
    if (vp.width / vp.height < 1.5) {
      await expect
        .poll(async () => (await page.locator('.puzzle__board').boundingBox())!.width)
        .toBeGreaterThan(boardBefore.width * 1.08)
    }
    const [boardBox, moreBox] = [(await page.locator('.puzzle__board').boundingBox())!, (await more.boundingBox())!]
    expect(moreBox.x).toBeGreaterThan(boardBox.x + boardBox.width)
    expect(moreBox.width).toBeLessThan(boardBox.width * 0.35)
    await more.click()
    await expect(page.locator('.puzzle__play')).not.toHaveClass(/is-finale/)
    await expect(page.locator('.puzzle__board-full')).toHaveCount(0)
    await expect(page.locator('.puzzle')).toHaveAttribute('data-scene', 'picnic')
    await expect(tablePieces(page)).toHaveCount(4)
    const boardAfter = (await page.locator('.puzzle__board').boundingBox())!
    expect(Math.abs(boardAfter.width - boardBefore.width)).toBeLessThan(2)
    await page.waitForTimeout(400)
    const pieceAfter = (await tablePieces(page).first().boundingBox())!
    expect(pieceAfter.width).toBeGreaterThan(pieceBefore.width * 0.85)

    await page.locator('.puzzle__gallery-btn').click()
    await expect(page.locator('.puzzle')).toHaveAttribute('data-view', 'picker')
    await expect(page.locator('.puzzle__card', { hasText: 'Пирог' })).toHaveClass(/is-solved/)
  })

  test('назад в меню', async ({ page }) => {
    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await expect(page.locator('.menu-grid')).toBeVisible()
  })
})

test('9 кусочков из настроек', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'meow-planet.settings'
    const cur = JSON.parse(localStorage.getItem(key) || '{}')
    localStorage.setItem(key, JSON.stringify({ ...cur, puzzlePieceCount: 9 }))
  })
  await openGame(page, 'puzzle')
  await openPicture(page, 'Пикник')
  await expect(tablePieces(page)).toHaveCount(9)
  await expect(page.locator('.puzzle__slot')).toHaveCount(9)
})
