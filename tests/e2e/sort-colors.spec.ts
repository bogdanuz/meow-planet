import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const pileToys = (page: Page) => page.locator('.sort-colors__pile .sort-colors__toy')
const bin = (page: Page, kind: string) => page.locator(`.sort-colors__bin[data-kind="${kind}"]`)
const speech = (page: Page) => page.locator('.sort-colors .game-presenter__speech')

async function wrongBinKind(page: Page, kind: string): Promise<string> {
  const kinds = await page.locator('.sort-colors__bin').evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).dataset.kind!),
  )
  return kinds.find((k) => k !== kind)!
}

type GrabPoint = { id: string; kind: string; x: number; y: number }

async function dragToBin(page: Page, toy: GrabPoint, kind: string): Promise<void> {
  const to = (await bin(page, kind).boundingBox())!
  await page.mouse.move(toy.x, toy.y)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 })
  await page.mouse.up()
}

/** Игрушка и точка, где она сверху кучи (палец берёт именно её). */
async function topToy(page: Page, kind?: string): Promise<GrabPoint> {
  await page.waitForTimeout(380)
  const found = await page.evaluate((want) => {
    const toys = [...document.querySelectorAll<HTMLElement>('.sort-colors__pile .sort-colors__toy')]
      .filter((el) => !want || el.dataset.kind === want)
      .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))
    const offsets = [
      [0, 0], [0.2, 0], [-0.2, 0], [0, -0.2], [0, 0.2],
      [0.2, -0.2], [-0.2, -0.2], [0.2, 0.2], [-0.2, 0.2],
    ]
    for (const el of toys) {
      const r = el.getBoundingClientRect()
      const size = el.offsetWidth
      for (const [dx, dy] of offsets) {
        const x = r.left + r.width / 2 + dx! * size
        const y = r.top + r.height / 2 + dy! * size
        if (document.elementFromPoint(x, y)?.closest('.sort-colors__toy') === el) {
          return { id: el.dataset.toyId!, kind: el.dataset.kind!, x, y }
        }
      }
    }
    return null
  }, kind)
  expect(found, `игрушка ${kind ?? ''} сверху кучи`).not.toBeNull()
  return found!
}

test.describe('Куда положить?', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page, 'sort-colors')
    await expect(pileToys(page)).toHaveCount(12)
  })

  test('игра без заглушки: рамка S16, 4 ящика, куча из 12, сова говорит', async ({ page }) => {
    await expect(page.locator('.coming-soon')).toHaveCount(0)
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.locator('.sort-colors__bin')).toHaveCount(4)
    await expect(page.locator('.sort-colors__sticker')).toHaveCount(4)
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(speech(page)).not.toBeEmpty()
  })

  test('перетаскивание в свой ящик', async ({ page }) => {
    const toy = await topToy(page)
    await dragToBin(page, toy, toy.kind)
    await expect(bin(page, toy.kind).locator(`[data-toy-id="${toy.id}"]`)).toHaveCount(1)
    await expect(pileToys(page)).toHaveCount(11)
  })

  test('чужой ящик: игрушка возвращается, после двух промахов подсказка', async ({ page }) => {
    const toy = await topToy(page)
    const wrong = await wrongBinKind(page, toy.kind)
    await dragToBin(page, toy, wrong)
    await expect(pileToys(page)).toHaveCount(12)
    await expect(speech(page)).toContainText('ящик')
    await expect(bin(page, toy.kind)).not.toHaveClass(/is-soft-highlight/)
    await page.waitForTimeout(400)
    await dragToBin(page, await topToy(page, toy.kind), wrong)
    await expect(bin(page, toy.kind)).toHaveClass(/is-soft-highlight/)
    await expect(speech(page)).toContainText('Смотри, вот ящик')
  })

  test('тап по игрушке → тап по ящику', async ({ page }) => {
    const toy = await topToy(page)
    await page.mouse.click(toy.x, toy.y)
    await expect(page.locator(`.sort-colors__toy[data-toy-id="${toy.id}"]`)).toHaveClass(/is-selected/)
    await bin(page, toy.kind).click()
    await expect(bin(page, toy.kind).locator(`[data-toy-id="${toy.id}"]`)).toHaveCount(1)
  })

  test('вся куча разобрана → праздник → новая куча', async ({ page }) => {
    const root = page.locator('.sort-colors')
    const round = await root.getAttribute('data-round')
    for (let i = 0; i < 12; i += 1) {
      const toy = await topToy(page)
      await page.mouse.click(toy.x, toy.y)
      await bin(page, toy.kind).click()
      await expect(bin(page, toy.kind).locator(`[data-toy-id="${toy.id}"]`)).toHaveCount(1)
    }
    await expect(speech(page)).toContainText(/Все игрушки|Всё разложено/)
    await expect(root).not.toHaveAttribute('data-round', round!, { timeout: 15_000 })
    await expect(pileToys(page)).toHaveCount(12)
  })

  test('задание: положить нужную игрушку → следующее задание', async ({ page }) => {
    const root = page.locator('.sort-colors')
    await page.locator('.sort-colors__mode-btn', { hasText: 'Задание' }).click()
    await expect(root).toHaveAttribute('data-mode', 'task')
    await expect(root).toHaveAttribute('data-task-type', 'one')
    const kind = (await root.getAttribute('data-task-kind'))!
    await expect(speech(page)).toContainText(/оложи/)
    const count = await pileToys(page).count()
    expect(count).toBeGreaterThanOrEqual(5)
    expect(count).toBeLessThanOrEqual(6)
    const round = await root.getAttribute('data-round')
    const toy = await topToy(page, kind)
    await dragToBin(page, toy, kind)
    await expect(speech(page)).toContainText('Всё получилось')
    await expect(root).not.toHaveAttribute('data-round', round!, { timeout: 15_000 })
    await expect(root).toHaveAttribute('data-mode', 'task')
  })

  test('задание: сначала чужая игрушка, сразу нужная — напоминание не перебивает похвалу', async ({ page }) => {
    const root = page.locator('.sort-colors')
    await page.locator('.sort-colors__mode-btn', { hasText: 'Задание' }).click()
    await expect(root).toHaveAttribute('data-task-type', 'one')
    const kind = (await root.getAttribute('data-task-kind'))!
    await expect(speech(page)).toContainText(/оложи/)
    const round = (await root.getAttribute('data-round'))!
    const other = await pileToys(page).evaluateAll(
      (els, want) => els.map((el) => (el as HTMLElement).dataset.kind!).find((k) => k !== want)!,
      kind,
    )
    await page.evaluate(() => {
      const el = document.querySelector('.sort-colors .game-presenter__speech')!
      const host = document.querySelector<HTMLElement>('.sort-colors')!
      const seen: { text: string; round: string }[] = []
      ;(window as unknown as { __speech: typeof seen }).__speech = seen
      new MutationObserver(() =>
        seen.push({ text: el.textContent ?? '', round: host.dataset.round ?? '' }),
      ).observe(el, { childList: true, characterData: true, subtree: true })
    })
    await dragToBin(page, await topToy(page, other), other)
    await dragToBin(page, await topToy(page, kind), kind)
    await expect(root).not.toHaveAttribute('data-round', round, { timeout: 15_000 })
    const seen = await page.evaluate(
      () => (window as unknown as { __speech: { text: string; round: string }[] }).__speech,
    )
    const praised = seen.findIndex((s) => s.text.includes('Всё получилось'))
    expect(praised).toBeGreaterThanOrEqual(0)
    const stale = seen.slice(praised).filter((s) => s.round === round && /оложи/.test(s.text))
    expect(stale).toEqual([])
  })

  test('назад в меню', async ({ page }) => {
    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await expect(page.locator('.menu-grid')).toBeVisible()
  })
})
