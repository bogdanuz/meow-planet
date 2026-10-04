import { expect, test, type Locator, type Page } from '@playwright/test'
import { openGame } from './helpers'

const root = (page: Page) => page.locator('.shape-build')
const shelf = (page: Page, kind: string) => page.locator(`.shape-build__shelf-item[data-kind="${kind}"]`)
const tool = (page: Page, role: string) => page.locator(`.shape-build [data-role="${role}"]`)

async function center(el: Locator): Promise<{ x: number; y: number }> {
  const box = (await el.boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 16 })
  await page.waitForTimeout(150)
  await page.mouse.up()
}

/** Перенести деталь с живой скоростью пальца: высокая деталь не раскачивается и встаёт ровно. */
async function carefulDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  const steps = 30
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
    await page.waitForTimeout(16)
  }
  await page.waitForTimeout(400)
  await page.mouse.up()
}

/** Точка на горке стартовой сцены (горка стоит на 26% ширины комнаты слева от шкафа). */
async function rampPoint(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.shape-build')!
    const cab = document.querySelector<HTMLElement>('.shape-build__cabinet')!
    const r = el.getBoundingClientRect()
    const scale = r.height / 11.5
    const right = r.width - cab.offsetWidth
    return { x: r.left + right * 0.26 - 0.9 * scale, y: r.top + r.height * 0.9 - 0.25 * scale }
  })
}

/** Мяч стартовой сцены ждёт на верху горки. */
async function parkedBallPoint(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.shape-build')!
    const cab = document.querySelector<HTMLElement>('.shape-build__cabinet')!
    const r = el.getBoundingClientRect()
    const scale = r.height / 11.5
    const right = r.width - cab.offsetWidth
    return { x: r.left + right * 0.26 - 0.91 * scale, y: r.top + r.height * 0.9 - 1.6 * scale }
  })
}

test.describe('Собери что угодно! 2.1', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page, 'shape-build')
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
  })

  test('рамка S16: назад, звук, инструменты с подписью, шестерёнка крайняя справа; стартовая сцена; корзинки нет', async ({
    page,
  }) => {
    await expect(page.locator('.app-shell .chrome')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Назад в меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Звук/ })).toBeVisible()
    await expect(page.locator('.shape-build__bar-tools > :last-child')).toHaveAttribute('aria-label', 'Настройки')
    await expect(page.locator('.shape-build__bar-tools > .game-tool .game-tool__label')).toHaveText([
      'Отменить',
      'Пуск!',
      'Бум!',
      'Замри!',
      'Гравитация',
      'Фото',
      'Заново',
      'Ещё',
    ])
    await expect(root(page)).toHaveAttribute('data-cabinet', 'open')
    await expect(page.locator('.shape-build__shelf-item')).toHaveCount(36)
    await expect(page.locator('.shape-build__basket')).toHaveCount(0)
  })

  test('шкаф по вкладкам «Детали / Предметы / Механизмы / Включатели»: подписи, чужие детали спрятаны', async ({
    page,
  }) => {
    const tabs = page.locator('.shape-build__tab')
    await expect(tabs.locator('.shape-build__tab-label')).toHaveText(['Детали', 'Предметы', 'Механизмы', 'Включатели'])
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    await expect(shelf(page, 'cube')).toBeVisible()
    await expect(shelf(page, 'cube').locator('.shape-build__shelf-label')).toHaveText('Кубик')
    await expect(shelf(page, 'cart')).toBeHidden()
    await page.locator('.shape-build__tab[data-tab="machines"]').click()
    await expect(shelf(page, 'cart')).toBeVisible()
    await expect(shelf(page, 'cube')).toBeHidden()
    await page.locator('.shape-build__tab[data-tab="switches"]').click()
    await expect(shelf(page, 'button')).toBeVisible()
    await shelf(page, 'button').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
  })

  test('мяч ждёт на горке; тап по нему — покатился', async ({ page }) => {
    await expect(root(page)).toHaveAttribute('data-ball', 'parked')
    const at = await parkedBallPoint(page)
    await page.mouse.click(at.x, at.y)
    await expect(root(page)).toHaveAttribute('data-ball', 'rolling')
    await expect(page.locator('.shape-build__piece-menu')).toBeHidden()
  })

  test('ручка шкафа прячет и открывает шкаф; ручка видна всегда', async ({ page }) => {
    const handle = page.getByRole('button', { name: 'Шкаф', exact: true })
    await handle.click()
    await expect(root(page)).toHaveAttribute('data-cabinet', 'closed')
    await expect(handle).toBeInViewport()
    await handle.click()
    await expect(root(page)).toHaveAttribute('data-cabinet', 'open')
  })

  test('тап по кубику в шкафу — кубик падает в комнату, шкаф открыт; вынес деталь из шкафа на ковёр — шкаф уехал', async ({
    page,
  }) => {
    await shelf(page, 'cube').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
    await expect(root(page)).toHaveAttribute('data-cabinet', 'open')
    const scene = (await page.locator('.shape-build__scene').boundingBox())!
    await drag(page, await center(shelf(page, 'brick')), { x: scene.x + scene.width * 0.4, y: scene.y + scene.height * 0.5 })
    await expect(root(page)).toHaveAttribute('data-pieces', '7')
    await expect(root(page)).toHaveAttribute('data-cabinet', 'closed')
  })

  test('потащил деталь из шкафа и отпустил над шкафом — детали нет', async ({ page }) => {
    const from = await center(shelf(page, 'cube'))
    await drag(page, from, { x: from.x, y: from.y + 120 })
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
  })

  test('тап по детали — кнопки рядом; ✕ убирает в шкаф; «Отменить» в шапке шагает назад по одному шагу', async ({
    page,
  }) => {
    const undo = tool(page, 'undo')
    await expect(undo).toBeVisible()
    await expect(undo).toHaveAttribute('aria-disabled', 'true')
    await page.waitForTimeout(800)
    const at = await rampPoint(page)
    await page.mouse.click(at.x, at.y)
    const menu = page.locator('.shape-build__piece-menu')
    await expect(menu).toBeVisible()
    for (const role of ['piece-turn', 'piece-smaller', 'piece-bigger', 'piece-remove']) {
      await expect(menu.locator(`[data-role="${role}"]`)).toBeVisible()
    }
    await menu.locator('[data-role="piece-bigger"]').click()
    await expect(undo).toHaveAttribute('aria-disabled', 'false')
    await menu.locator('[data-role="piece-remove"]').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '4')
    await expect(menu).toBeHidden()
    await undo.click()
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
    await expect(undo).toHaveAttribute('aria-disabled', 'false')
    await undo.click()
    await expect(undo).toHaveAttribute('aria-disabled', 'true')
    await expect(undo).toBeVisible()
  })

  test('механизм: тап — его действие без меню; удержание — кружок под пальцем и меню', async ({ page }) => {
    await tool(page, 'clear').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '0')
    await page.locator('.shape-build__tab[data-tab="switches"]').click()
    const lampAt = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.shape-build')!
      const cab = document.querySelector<HTMLElement>('.shape-build__cabinet')!
      const r = el.getBoundingClientRect()
      const scale = r.height / 11.5
      return { x: r.left + (r.width - cab.offsetWidth) * 0.45, y: r.top + r.height * 0.9 - 0.6 * scale }
    })
    await carefulDrag(page, await center(shelf(page, 'lamp')), { x: lampAt.x, y: lampAt.y - 20 })
    await expect(root(page)).toHaveAttribute('data-pieces', '1')
    await page.waitForTimeout(700)
    const menu = page.locator('.shape-build__piece-menu')
    await page.mouse.click(lampAt.x, lampAt.y)
    await page.waitForTimeout(300)
    await expect(menu).toBeHidden()
    await page.mouse.move(lampAt.x, lampAt.y)
    await page.mouse.down()
    await expect(page.locator('.shape-build__hold.is-demo')).toHaveCount(0)
    await expect(page.locator('.shape-build__hold')).toHaveCount(1)
    await page.waitForTimeout(650)
    await expect(menu).toBeVisible()
    await page.mouse.up()
    await expect(menu).toBeVisible()
    await expect(menu.locator('[data-role="piece-power"]')).toHaveAttribute('aria-label', 'Выключить')
    await expect(page.locator('.shape-build__hold')).toHaveCount(0)
  })

  test('утащил деталь из комнаты в шкаф — «чпок», детали нет; «Отменить» возвращает', async ({ page }) => {
    await page.waitForTimeout(800)
    await drag(page, await rampPoint(page), await center(shelf(page, 'arch')))
    await expect(root(page)).toHaveAttribute('data-pieces', '4')
    await tool(page, 'undo').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
    await expect(tool(page, 'undo')).toHaveAttribute('aria-disabled', 'true')
  })

  test('достал деталь и «Отменить» — её нет; мяч толкнули и «Отменить» — снова ждёт на горке', async ({ page }) => {
    await shelf(page, 'cube').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
    await tool(page, 'undo').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
    const at = await parkedBallPoint(page)
    await page.mouse.click(at.x, at.y)
    await expect(root(page)).toHaveAttribute('data-ball', 'rolling')
    await tool(page, 'undo').click()
    await expect(root(page)).toHaveAttribute('data-ball', 'parked')
  })

  test('«Бум!» трясёт комнату; «Замри!» и «Гравитация» переключаются, гравитация — с тостом', async ({ page }) => {
    await tool(page, 'boom').click()
    await expect(root(page)).toHaveClass(/is-shaking/)
    await expect(root(page)).toHaveAttribute('data-pieces', '5')

    await tool(page, 'wand').click()
    await expect(root(page)).toHaveAttribute('data-frozen', '1')
    await expect(tool(page, 'wand')).toHaveAttribute('aria-pressed', 'true')
    await tool(page, 'wand').click()
    await expect(root(page)).toHaveAttribute('data-frozen', '0')

    const toast = page.locator('.shape-build__toast')
    await tool(page, 'gravity').click()
    await expect(root(page)).toHaveAttribute('data-gravity', 'off')
    await expect(toast).toHaveText('Земля больше не тянет вниз — всё плавает')
    await tool(page, 'gravity').click()
    await expect(root(page)).toHaveAttribute('data-gravity', 'on')
    await expect(toast).toHaveText('Земля снова тянет всё вниз')
  })

  test('«Заново» спрашивает «Убрать всё?» и очищает комнату дочиста; «Отменить» — как было', async ({
    page,
  }) => {
    await shelf(page, 'cube').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
    await tool(page, 'clear').click()
    await expect(page.locator('.choice-dialog__text')).toHaveText('Убрать всё?')
    await page.locator('[data-choice="no"]').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
    await tool(page, 'clear').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '0')
    await tool(page, 'undo').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '6')
  })

  test('после «Заново» и выхода в меню первая постройка не возвращается — комната сохранена пустой', async ({ page }) => {
    await tool(page, 'clear').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '0')
    await page.getByRole('button', { name: 'Назад в меню' }).click()
    await page.locator('[data-game-id="shape-build"]').click()
    await expect(root(page)).toBeVisible()
    await page.waitForTimeout(600)
    await expect(root(page)).toHaveAttribute('data-pieces', '0')
  })

  test('«Галерея»: долгое нажатие на фото — режим выбора; в большом фото — «Удалить»', async ({ page }) => {
    const snap = page.locator('.shape-build__snap')
    for (let i = 0; i < 2; i += 1) {
      await tool(page, 'photo').click()
      await expect(snap).toHaveCount(0, { timeout: 4000 })
    }
    await tool(page, 'more').click()
    await tool(page, 'gallery').click()
    const gallery = page.locator('.shape-build__gallery')
    const photos = page.locator('.shape-build__photo')
    await expect(photos).toHaveCount(2)
    await expect(gallery).toHaveAttribute('data-selecting', '0')

    const box = await photos.first().boundingBox()
    if (!box) throw new Error('нет фото')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()
    await expect(gallery).toHaveAttribute('data-selecting', '1')
    await expect(photos.first()).toHaveClass(/is-selected/)
    await expect(page.locator('[data-role="photo-delete"]')).toHaveText('Удалить (1)')
    await page.locator('[data-role="photo-select-all"]').click()
    await expect(page.locator('[data-role="photo-select-all"]')).toBeDisabled()
    await page.locator('[data-role="photo-clear-all"]').click()
    await expect(page.locator('[data-role="photo-clear-all"]')).toBeDisabled()
    await page.locator('[data-role="photo-select-toggle"]').click()
    await expect(gallery).toHaveAttribute('data-selecting', '0')

    await photos.first().click()
    const viewer = page.locator('.shape-build__viewer')
    await expect(viewer).toBeVisible()
    await viewer.locator('[data-role="viewer-delete"]').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(viewer).toBeHidden()
    await expect(photos).toHaveCount(1)
  })

  test('«Фото»: снимок улетает в «Ещё», тап по нему — «Галерея»; «Выбрать» → «Удалить»; «Как играть» открывается', async ({
    page,
  }) => {
    await tool(page, 'photo').click()
    const snap = page.locator('.shape-build__snap')
    await expect(snap).toHaveCount(1)
    await snap.click({ force: true })
    await expect(root(page)).toHaveAttribute('data-view', 'gallery')
    await expect(snap).toHaveCount(0)
    const photos = page.locator('.shape-build__photo')
    await expect(photos).toHaveCount(1)
    await page.locator('[data-role="gallery-close"]').click()

    await tool(page, 'photo').click()
    await expect(snap).toHaveCount(0, { timeout: 4000 })
    await tool(page, 'more').click()
    await expect(page.locator('.shape-build__more')).toBeVisible()
    await tool(page, 'gallery').click()
    await expect(root(page)).toHaveAttribute('data-view', 'gallery')
    await expect(photos).toHaveCount(2)
    await page.locator('[data-role="photo-select-toggle"]').click()
    await page.locator('[data-role="photo-select-all"]').click()
    await expect(page.locator('[data-role="photo-delete"]')).toHaveText('Удалить (2)')
    await page.locator('[data-role="photo-delete"]').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(photos).toHaveCount(0)
    await page.locator('[data-role="gallery-close"]').click()
    await tool(page, 'photo').click()
    await expect(snap).toHaveCount(0, { timeout: 4000 })
    await tool(page, 'more').click()
    await tool(page, 'gallery').click()
    await expect(photos).toHaveCount(1)
    await page.locator('[data-role="photo-select-toggle"]').click()
    await photos.first().click()
    await expect(page.locator('[data-role="photo-delete"]')).toHaveText('Удалить (1)')
    await page.locator('[data-role="photo-delete"]').click()
    await page.locator('[data-choice="yes"]').click()
    await expect(photos).toHaveCount(0)
    await page.locator('[data-role="gallery-close"]').click()
    await expect(root(page)).not.toHaveAttribute('data-view', 'gallery')

    await tool(page, 'more').click()
    await tool(page, 'howto').click()
    await expect(page.locator('.shape-build__howto')).toBeVisible()
    await expect(page.locator('.shape-build__howto-item')).toHaveCount(9)
    await expect(page.locator('.shape-build__howto-item .shape-build__howto-name')).toHaveText([
      'Достать деталь',
      'Кнопки у детали',
      'Механизм: нажать или подержать',
      'Бросить и поднять',
      'Механизмы и «Пуск!»',
      'Кнопка и провод',
      'Волшебные кнопки',
      'Большая комната',
      'Шаг назад и фото',
    ])
    await page.locator('[data-role="howto-tab-laws"]').click()
    await expect(page.locator('.shape-build__law').first()).toBeVisible()
    await expect(page.locator('.shape-build__law-name').first()).toBeVisible()
    await expect(page.locator('.shape-build__law').first().locator('[data-tip="say"]')).toContainText('Скажите ребёнку')
    await expect(page.locator('.shape-build__law').first().locator('[data-tip="try"]')).toContainText('Попробуйте дома')
    await page.locator('[data-role="howto-tab-recipes"]').click()
    await expect(page.locator('.shape-build__recipe-level-title')).toHaveText([
      'Простые',
      'Цепочки',
      'Этажи',
      'Огромные машины',
    ])
    expect(await page.locator('.shape-build__recipe').count()).toBeGreaterThanOrEqual(30)
    await expect(page.locator('.shape-build__recipe').first().locator('.shape-build__recipe-steps li').first()).toBeVisible()
    await expect(page.locator('.shape-build__recipe').first().locator('.shape-build__recipe-preview')).toHaveAttribute(
      'data-painted',
      'true',
    )
    await page.locator('[data-role="howto-tab-tricks"]').click()
    const tricks = page.locator('.shape-build__trick .shape-build__howto-name')
    await expect(tricks.first()).toBeVisible()
    for (const title of ['Как управлять', 'Зарядить ракету', 'Зарядить пушку', 'Кнопка набок и вверх ногами', 'Мяу и Олли']) {
      await expect(tricks.filter({ hasText: title })).toHaveCount(1)
    }
    await page.locator('[data-role="howto-close"]').click()
    await expect(page.locator('.shape-build__howto')).toBeHidden()
  })

  test('«Как играть» → «Построить» грузовик: в комнате пример, «Пуск!» включает, второй раз — стоп', async ({
    page,
  }) => {
    await tool(page, 'more').click()
    await tool(page, 'howto').click()
    await page.locator('[data-role="howto-tab-recipes"]').click()
    await page.locator('.shape-build__recipe[data-recipe="truck"] [data-role="recipe-build"]').click()
    await expect(page.locator('.shape-build__howto')).toBeHidden()
    await expect(root(page)).toHaveAttribute('data-pieces', '3')
    await expect(root(page)).toHaveAttribute('data-cabinet', 'closed')
    const start = tool(page, 'start')
    await expect(start).toHaveAttribute('aria-pressed', 'false')
    await start.click()
    await expect(start).toHaveAttribute('aria-pressed', 'true')
    await start.click()
    await expect(start).toHaveAttribute('aria-pressed', 'false')
    await tool(page, 'undo').click()
    await expect(root(page)).toHaveAttribute('data-pieces', '5')
  })

  test('шестерёнка → раздел игры: «Липучка», размер деталей; спрятал кубик → «Назад в игру»', async ({ page }) => {
    await page.getByRole('button', { name: 'Настройки' }).click()
    await expect(page.locator('.settings-page[data-section="shape-build"]')).toBeVisible()
    await expect(page.locator('#sandbox-sticky')).toBeChecked()
    await expect(page.locator('#sandbox-size')).toBeVisible()
    await expect(page.locator('#sandbox-max')).toBeVisible()
    await page.locator('#sandbox-kind-cube').uncheck()
    await page.getByRole('button', { name: 'Назад в игру' }).click()
    await expect(root(page)).toBeVisible()
    await expect(page.locator('.shape-build__shelf-item')).toHaveCount(35)
    await expect(shelf(page, 'cube')).toHaveCount(0)
  })
})
