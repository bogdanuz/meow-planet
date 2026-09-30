import { expect, test, type Locator, type Page } from '@playwright/test'
import { openGame } from './helpers'

type Rgb = { r: [number, number]; g: [number, number]; b: [number, number] }

const BLUE: Rgb = { r: [0, 120], g: [120, 200], b: [180, 255] }
const YELLOW: Rgb = { r: [200, 255], g: [160, 225], b: [0, 110] }
const INK: Rgb = { r: [0, 90], g: [0, 70], b: [0, 80] }

async function countPixels(canvas: Locator, range: Rgb): Promise<number> {
  return canvas.evaluate((node, color) => {
    const view = node as HTMLCanvasElement
    const ctx = view.getContext('2d')
    if (!ctx) return 0
    const data = ctx.getImageData(0, 0, view.width, view.height).data
    let count = 0
    for (let index = 0; index < data.length; index += 16) {
      const r = data[index] ?? 0
      const g = data[index + 1] ?? 0
      const b = data[index + 2] ?? 0
      if (r >= color.r[0] && r <= color.r[1] && g >= color.g[0] && g <= color.g[1] && b >= color.b[0] && b <= color.b[1]) {
        count += 1
      }
    }
    return count
  }, range)
}

async function tapCanvas(page: Page, canvas: Locator, fx: number, fy: number): Promise<void> {
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box!.x + box!.width * fx, box!.y + box!.height * fy)
}

async function strokeCanvas(page: Page, canvas: Locator, y: number): Promise<void> {
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width * 0.25, box!.y + box!.height * y)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * 0.75, box!.y + box!.height * y, { steps: 10 })
  await page.mouse.up()
}

test.describe('рисовалка', () => {
  async function openDrawing(page: Page): Promise<void> {
    await openGame(page, 'drawing')
    await expect(page.locator('.drawing[data-ready="1"]')).toBeVisible({ timeout: 15000 })
  }

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1180, height: 820 })
  })

  test('хедер и левая панель на месте, панели крупные и все цвета видны', async ({ page }) => {
    await openDrawing(page)
    const bar = page.locator('.drawing__bar')
    await expect(bar.locator('.drawing__bar-group--left').getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(bar.locator('.drawing__bar-group--center').getByRole('button', { name: 'Отменить' })).toBeVisible()
    await expect(bar.locator('.drawing__bar-group--right').getByRole('button', { name: 'Настройки' })).toBeVisible()

    const island = page.locator('.drawing__island')
    const islandBox = await island.boundingBox()
    expect(islandBox).not.toBeNull()
    expect(islandBox!.y + islandBox!.height).toBeLessThanOrEqual(820)
    const brushBox = await island.getByRole('button', { name: 'Кисть' }).boundingBox()
    expect(brushBox!.height).toBeGreaterThanOrEqual(100)

    await island.getByRole('button', { name: 'Цвета' }).click()
    const colors = page.locator('[data-pop-id="colors"]')
    await expect(colors).toHaveClass(/is-open/)
    for (const swatch of await colors.locator('[data-color-id]').all()) {
      await expect(swatch).toBeInViewport({ ratio: 1 })
    }
    const swatchBox = await colors.locator('[data-color-id="red"]').boundingBox()
    expect(swatchBox!.width).toBeGreaterThanOrEqual(95)
    await colors.locator('[data-color-id="blue"]').click()
    await expect(colors).not.toHaveClass(/is-open/)
  })

  test('кисть рисует, заливка по тапу красит лист, отмена возвращает', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    await page.getByRole('button', { name: 'Цвета' }).click()
    await page.locator('[data-color-id="blue"]').click()
    await strokeCanvas(page, canvas, 0.4)
    expect(await countPixels(canvas, BLUE)).toBeGreaterThan(50)

    await page.getByRole('button', { name: 'Заливка' }).click()
    await page.getByRole('button', { name: 'Цвета' }).click()
    await page.locator('[data-color-id="yellow"]').click()
    await tapCanvas(page, canvas, 0.5, 0.8)
    const yellow = await countPixels(canvas, YELLOW)
    expect(yellow).toBeGreaterThan(20000)
    expect(await countPixels(canvas, BLUE)).toBeGreaterThan(50)

    await page.getByRole('button', { name: 'Отменить' }).click()
    expect(await countPixels(canvas, YELLOW)).toBeLessThan(yellow / 10)
  })

  test('тап по холсту при открытой панели только закрывает её, а «Отменить» возвращает прежний лист', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    const undo = page.getByRole('button', { name: 'Отменить' })
    await page.getByRole('button', { name: 'Заливка' }).click()
    await page.getByRole('button', { name: 'Цвета' }).click()
    await tapCanvas(page, canvas, 0.5, 0.5)
    await expect(page.locator('[data-pop-id="colors"]')).not.toHaveClass(/is-open/)
    await expect(undo).toBeDisabled()

    await tapCanvas(page, canvas, 0.5, 0.5)
    await expect(undo).toBeEnabled()
    await tapCanvas(page, canvas, 0.5, 0.5)
    await undo.click()
    await expect(undo).toBeDisabled()

    await tapCanvas(page, canvas, 0.5, 0.5)
    await page.getByRole('button', { name: 'Заново' }).click()
    await expect(page.getByRole('button', { name: 'Заново' })).toBeDisabled()
    await undo.click()
    await expect(page.getByRole('button', { name: 'Заново' })).toBeEnabled()
  })

  test('раскраска как фон: контур поверх заливки и не стирается ластиком', async ({ page }) => {
    await openDrawing(page)
    await page.getByRole('button', { name: 'Фон' }).click()
    await page.locator('[data-bg-choice="coloring"]').click()
    await expect(page.locator('[data-scene-id]')).toHaveCount(6)
    await expect(page.locator('[data-scene-id="balloon"]')).toContainText('Шарик')
    await page.locator('[data-scene-id="apple"]').click()

    const canvas = page.locator('.drawing__canvas')
    await expect.poll(() => countPixels(canvas, INK), { timeout: 15000 }).toBeGreaterThan(500)
    const ink = await countPixels(canvas, INK)

    await page.getByRole('button', { name: 'Заливка' }).click()
    await page.getByRole('button', { name: 'Цвета' }).click()
    await page.locator('[data-color-id="yellow"]').click()
    await tapCanvas(page, canvas, 0.03, 0.04)
    expect(await countPixels(canvas, YELLOW)).toBeGreaterThan(5000)
    expect(await countPixels(canvas, INK)).toBeGreaterThanOrEqual(ink * 0.95)

    await page.getByRole('button', { name: 'Ластик' }).click()
    await strokeCanvas(page, canvas, 0.5)
    expect(await countPixels(canvas, INK)).toBeGreaterThanOrEqual(ink * 0.95)
  })

  test('смена фона сохраняет рисунок в галерею; галерея под хедером', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    await strokeCanvas(page, canvas, 0.5)
    await page.getByRole('button', { name: 'Фон' }).click()
    await page.locator('[data-bg-choice="color"]').click()
    await page.locator('[data-bg-color="green"]').click()
    await expect.poll(() => countPixels(canvas, { r: [70, 110], g: [165, 205], b: [85, 125] })).toBeGreaterThan(20000)

    await page.getByRole('button', { name: 'Галерея' }).click()
    await expect(page.locator('.drawing__screen .creative-gallery')).toBeVisible()
    await expect(page.locator('.drawing__dock')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Отменить' })).toBeHidden()
    await expect(page.locator('.creative-gallery__card')).toHaveCount(1)
    await page.locator('.creative-gallery__open').first().click()
    await expect(page.getByRole('button', { name: 'Скачать' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Удалить' })).toBeVisible()
    await page.locator('.choice-dialog').getByRole('button', { name: 'Назад', exact: true }).click()
    await page.getByRole('button', { name: 'Назад к холсту' }).click()
    await expect(page.locator('.drawing__stage')).toBeVisible()
  })

  test('настройки из игры возвращают в рисовалку', async ({ page }) => {
    await openDrawing(page)
    await page.locator('.drawing__bar').getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.screen--parent')).toBeVisible()
    await expect(page).toHaveURL(/#\/parent\/drawing$/)
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(page.locator('.drawing[data-game-id="drawing"]')).toBeVisible()
  })
})
