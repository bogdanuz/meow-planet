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

  test('«Свой цвет»: радужное окошко, «Готово», кисть рисует этим цветом', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    await page.getByRole('button', { name: 'Цвета' }).click()
    await page.locator('[data-color-id="custom"]').click()
    const field = page.locator('.drawing__rainbow')
    await expect(field).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: 'Готово' })).toBeInViewport({ ratio: 1 })
    const box = await field.boundingBox()
    await page.mouse.click(box!.x + box!.width * 0.62, box!.y + box!.height * 0.5)
    const hex = (await page.locator('.drawing__custom-preview').getAttribute('data-color')) ?? ''
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    await page.getByRole('button', { name: 'Готово' }).click()
    await expect(page.locator('[data-pop-id="custom-color"]')).not.toHaveClass(/is-open/)
    await strokeCanvas(page, canvas, 0.5)
    const value = Number.parseInt(hex.slice(1), 16)
    const near = (channel: number): [number, number] => [Math.max(0, channel - 14), Math.min(255, channel + 14)]
    const range: Rgb = { r: near((value >> 16) & 255), g: near((value >> 8) & 255), b: near(value & 255) }
    expect(await countPixels(canvas, range)).toBeGreaterThan(50)
  })

  test('все кисти оставляют краску, широкое касание тоже рисует', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    await page.getByRole('button', { name: 'Цвета' }).click()
    await page.locator('[data-color-id="blue"]').click()
    const rows: Record<string, number> = { brush: 0.2, marker: 0.35, crayon: 0.5, watercolor: 0.65 }
    let before = 0
    for (const [brush, y] of Object.entries(rows)) {
      await page.getByRole('button', { name: 'Кисть' }).click()
      await page.locator(`[data-brush="${brush}"]`).click()
      await strokeCanvas(page, canvas, y)
      const painted = await countPixels(canvas, { r: [0, 235], g: [90, 240], b: [150, 255] })
      expect(painted, brush).toBeGreaterThan(before + 30)
      before = painted
    }

    await page.getByRole('button', { name: 'Кисть' }).click()
    await page.locator('[data-brush="brush"]').click()
    const blueBefore = await countPixels(canvas, BLUE)
    await canvas.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      const at = (fx: number) => ({
        bubbles: true,
        pointerId: 9,
        pointerType: 'touch',
        width: 64,
        height: 64,
        clientX: rect.left + rect.width * fx,
        clientY: rect.top + rect.height * 0.85,
      })
      node.dispatchEvent(new PointerEvent('pointerdown', at(0.2)))
      window.dispatchEvent(new PointerEvent('pointermove', at(0.5)))
      window.dispatchEvent(new PointerEvent('pointerup', at(0.5)))
    })
    expect(await countPixels(canvas, BLUE)).toBeGreaterThan(blueBefore + 30)
  })

  test('тап по холсту при открытой панели только закрывает её, а «Отменить» возвращает прежний лист', async ({ page }) => {
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    const undo = page.getByRole('button', { name: 'Отменить' })
    await page.getByRole('button', { name: 'Заливка' }).click()
    await page.getByRole('button', { name: 'Цвета' }).click()
    await tapCanvas(page, canvas, 0.85, 0.5)
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

  async function pickTwoColorPhoto(page: Page): Promise<void> {
    const dataUrl = await page.evaluate(() => {
      const source = document.createElement('canvas')
      source.width = 1200
      source.height = 600
      const ctx = source.getContext('2d')!
      ctx.fillStyle = '#e8261c'
      ctx.fillRect(0, 0, 600, 600)
      ctx.fillStyle = '#1c3fe8'
      ctx.fillRect(600, 0, 600, 600)
      return source.toDataURL('image/png')
    })
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Фон' }).click()
    await page.locator('[data-bg-choice="photo"]').click()
    await (await chooser).setFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dataUrl.split(',')[1]!, 'base64'),
    })
  }

  const PHOTO_RED: Rgb = { r: [190, 255], g: [0, 80], b: [0, 80] }
  const PHOTO_BLUE: Rgb = { r: [0, 80], g: [30, 110], b: [190, 255] }

  test('своё фото: редактор поверх листа, двигаем и крутим, «Готово» делает фон', async ({ page }) => {
    await openDrawing(page)
    await pickTwoColorPhoto(page)

    const editor = page.getByRole('dialog', { name: 'Подогнать фото под лист' })
    await expect(editor).toBeVisible()
    for (const name of ['Отмена', 'Повернуть', 'Уменьшить', 'Увеличить', 'Готово']) {
      await expect(editor.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 })
    }

    const canvas = page.locator('.drawing__canvas')
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.5, { steps: 8 })
    await page.mouse.up()
    await editor.getByRole('button', { name: 'Готово' }).click()
    await expect(editor).toHaveCount(0)

    await expect.poll(() => countPixels(canvas, PHOTO_RED), { timeout: 15000 }).toBeGreaterThan(20000)
    const red = await countPixels(canvas, PHOTO_RED)
    const blue = await countPixels(canvas, PHOTO_BLUE)
    expect(red).toBeGreaterThan(blue * 2)

    await pickTwoColorPhoto(page)
    await expect(editor).toBeVisible()
    await editor.getByRole('button', { name: 'Увеличить' }).click()
    await editor.getByRole('button', { name: 'Повернуть' }).click()
    await editor.getByRole('button', { name: 'Готово' }).click()
    await expect(editor).toHaveCount(0)
    await expect.poll(() => countPixels(canvas, PHOTO_BLUE), { timeout: 15000 }).toBeGreaterThan(5000)
  })

  test('своё фото: «Отмена» оставляет прежний лист', async ({ page }) => {
    await openDrawing(page)
    await pickTwoColorPhoto(page)
    const editor = page.getByRole('dialog', { name: 'Подогнать фото под лист' })
    await expect(editor).toBeVisible()
    await editor.getByRole('button', { name: 'Отмена' }).click()
    await expect(editor).toHaveCount(0)
    const canvas = page.locator('.drawing__canvas')
    expect(await countPixels(canvas, PHOTO_RED)).toBe(0)
    expect(await countPixels(canvas, PHOTO_BLUE)).toBe(0)
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
    const viewer = page.locator('.creative-viewer')
    await expect(viewer.getByRole('button', { name: 'Рисовать дальше' })).toBeVisible()
    await expect(viewer.getByRole('button', { name: 'Скачать' })).toBeVisible()
    await expect(viewer.getByRole('button', { name: 'Удалить' })).toBeVisible()
    await expect(viewer.locator('.creative-viewer__image')).toBeVisible()
    await viewer.getByRole('button', { name: 'Назад', exact: true }).click()
    await expect(viewer).toHaveCount(0)
    await page.getByRole('button', { name: 'Назад к холсту' }).click()
    await expect(page.locator('.drawing__stage')).toBeVisible()
  })

  test('галерея: миниатюра меньше полной картинки; выбранные рисунки скачиваются отдельными файлами', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true })
    })
    await openDrawing(page)
    const canvas = page.locator('.drawing__canvas')
    await strokeCanvas(page, canvas, 0.3)
    await page.getByRole('button', { name: 'Заново' }).click()
    await expect(page.getByRole('button', { name: 'Заново' })).toBeDisabled()
    await strokeCanvas(page, canvas, 0.6)
    await page.getByRole('button', { name: 'Галерея' }).click()
    await expect(page.locator('.creative-gallery__card')).toHaveCount(2)

    const sizes = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('meow-planet-creative')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const rows = await new Promise<{ id: string; blob: Blob }[]>((resolve) => {
        const request = db.transaction('blobs', 'readonly').objectStore('blobs').getAll()
        request.onsuccess = () => resolve(request.result as { id: string; blob: Blob }[])
      })
      db.close()
      return rows.map((row) => ({ id: row.id, size: row.blob.size, type: row.blob.type }))
    })
    const fulls = sizes.filter((row) => row.id.startsWith('full-'))
    const thumbs = sizes.filter((row) => row.id.startsWith('thumb-'))
    expect(fulls).toHaveLength(2)
    expect(thumbs).toHaveLength(2)
    for (const full of fulls) {
      const thumb = thumbs.find((row) => row.id === full.id.replace('full-', 'thumb-'))
      expect(full.type).toBe('image/png')
      expect(thumb!.size).toBeLessThan(full.size)
    }

    await page.getByRole('button', { name: 'Выбрать', exact: true }).click()
    await page.getByRole('button', { name: 'Выбрать все' }).click()
    const downloads: string[] = []
    page.on('download', (download) => downloads.push(download.suggestedFilename()))
    await page.getByRole('button', { name: 'Скачать (2)' }).click()
    await expect.poll(() => downloads.length, { timeout: 5000 }).toBe(2)
    expect(downloads.every((name) => /^risunok_.+\.png$/.test(name))).toBe(true)
    expect(new Set(downloads).size).toBe(2)
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
