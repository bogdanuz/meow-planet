import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGameById } from '../../src/games/registry'
import {
  createMemoryCreativeRepository,
  setCreativeRepositoryForTests,
} from '../../src/shared/creative-repository'
import { createDrawingDraft } from '../../src/shared/creative-works'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

describe('рисовалка', () => {
  afterEach(() => {
    setCreativeRepositoryForTests(null)
    document.body.replaceChildren()
  })

  it('хедер: слева назад и звук, в центре отменить и заново, справа фон, галерея, настройки', async () => {
    setCreativeRepositoryForTests(createMemoryCreativeRepository())
    const goSettings = vi.fn()
    const host = mount({ goSettings })
    await flush()

    const labels = (selector: string) =>
      [...host.querySelectorAll(`${selector} > button`)].map((node) => node.getAttribute('aria-label'))
    expect(labels('.drawing__bar-group--left')).toEqual(['Назад в меню', 'Звук включён'])
    expect(labels('.drawing__bar-group--center')).toEqual(['Отменить', 'Заново'])
    expect(labels('.drawing__bar-group--right')).toEqual(['Фон', 'Галерея', 'Настройки'])
    expect(host.querySelector('[aria-label="Назад в меню"] img')?.getAttribute('src')).toContain('icon-back.png')
    expect(host.querySelector('[aria-label="Настройки"] img')?.getAttribute('src')).toContain('icon-settings.png')

    click(host, '[aria-label="Настройки"]')
    await flush()
    expect(goSettings).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('левая панель: цвета, кисть, заливка, ластик, размер; панели раскрываются и закрываются', async () => {
    setCreativeRepositoryForTests(createMemoryCreativeRepository())
    const host = mount()
    await flush()

    const island = [...host.querySelectorAll('.drawing__island > button')].map((node) => node.getAttribute('aria-label'))
    expect(island).toEqual(['Цвета', 'Кисть', 'Заливка', 'Ластик', 'Размер'])
    expect(host.querySelectorAll('[data-color-id]')).toHaveLength(10)
    expect(host.querySelectorAll('[data-brush]')).toHaveLength(4)
    expect(host.querySelectorAll('[data-size]')).toHaveLength(2)
    expect(host.querySelector('[data-brush="rainbow"]')).toBeNull()
    expect(host.querySelector('[data-brush="marker"] .creative-tool__label')?.textContent).toBe('Фломастер')
    expect(host.querySelectorAll('.drawing__pop.is-open')).toHaveLength(0)

    click(host, '[aria-label="Цвета"]')
    expect(pop(host, 'colors').classList.contains('is-open')).toBe(true)
    expect(pop(host, 'colors').getAttribute('aria-hidden')).toBe('false')
    click(host, '[data-color-id="blue"]')
    expect(pop(host, 'colors').classList.contains('is-open')).toBe(false)
    expect(host.querySelector('[data-color-id="blue"]')?.classList.contains('is-selected')).toBe(true)

    click(host, '[aria-label="Кисть"]')
    expect(pop(host, 'brushes').classList.contains('is-open')).toBe(true)
    click(host, '[data-brush="crayon"]')
    expect(pop(host, 'brushes').classList.contains('is-open')).toBe(false)
    expect(host.querySelector('[aria-label="Кисть"] img')?.getAttribute('src')).toContain('crayon.png')

    click(host, '[aria-label="Заливка"]')
    expect(host.querySelector('[aria-label="Заливка"]')?.classList.contains('is-selected')).toBe(true)
    expect(host.querySelector('[aria-label="Кисть"]')?.classList.contains('is-selected')).toBe(false)

    click(host, '[aria-label="Размер"]')
    click(host, '[data-size="thin"]')
    expect(host.querySelector('[aria-label="Размер"] img')?.getAttribute('src')).toContain('thin.png')
    unmount()
  })

  it('фон: цвет, фото и раскраска; раскраска открывает 4 листа по 6 картинок', async () => {
    const repo = createMemoryCreativeRepository()
    setCreativeRepositoryForTests(repo)
    const host = mount()
    await flush()

    click(host, '[aria-label="Фон"]')
    expect(pop(host, 'bg').classList.contains('is-open')).toBe(true)
    const choices = [...pop(host, 'bg').querySelectorAll('[data-bg-choice]')].map((node) => node.getAttribute('aria-label'))
    expect(choices).toEqual(['Цвет', 'Фото', 'Раскраска'])

    click(host, '[data-bg-choice="coloring"]')
    await flush()
    expect(host.querySelectorAll('[data-scene-id]')).toHaveLength(6)
    expect(host.querySelector('[data-scene-id="balloon"] .drawing__card-title')?.textContent).toBe('Шарик')
    expect(host.querySelector('[aria-label="Предыдущий лист"]')?.hasAttribute('disabled')).toBe(true)
    expect(host.querySelector('[data-role="back"]')?.getAttribute('aria-label')).toBe('Назад к холсту')
    expect(host.querySelector<HTMLElement>('[aria-label="Отменить"]')?.hidden).toBe(true)
    expect(host.querySelector<HTMLElement>('.drawing__dock')?.hidden).toBe(true)

    click(host, '[aria-label="Следующий лист"]')
    expect(host.querySelector('[data-scene-id="duck"]')).not.toBeNull()
    click(host, '[data-scene-id="car"]')
    await flush()
    expect(host.querySelector('.drawing__picker')).toBeNull()
    expect(host.querySelector<HTMLElement>('.drawing__stage')?.hidden).toBe(false)
    unmount()
    await flush()
    const saved = await repo.list()
    expect(saved.some((work) => work.background.kind === 'coloring' && work.background.sceneId === 'car')).toBe(true)
  })

  it('смена фона на непустом листе сохраняет рисунок в галерею и открывает новый лист', async () => {
    const draft = createDrawingDraft(10)
    draft.strokes = [{ tool: 'brush', color: 'red', size: 'thick', points: [{ x: 0.2, y: 0.2 }] }]
    const repo = createMemoryCreativeRepository([draft])
    setCreativeRepositoryForTests(repo)
    const host = mount()
    await flush()

    click(host, '[aria-label="Фон"]')
    click(host, '[data-bg-choice="color"]')
    expect(pop(host, 'bg-colors').classList.contains('is-open')).toBe(true)
    click(host, '[data-bg-color="yellow"]')
    await flush()
    await flush()
    unmount()
    await flush()

    const saved = await repo.list()
    const old = saved.find((work) => work.id === draft.id)
    expect(old?.status).toBe('saved')
    expect(old?.strokes).toHaveLength(1)
    const fresh = saved.find((work) => work.id !== draft.id)
    expect(fresh?.strokes).toHaveLength(0)
    expect(fresh?.background).toEqual({ kind: 'solid', color: 'yellow' })
  })

  it('«Отменить» на пустом листе после смены фона возвращает прежний рисунок', async () => {
    const draft = createDrawingDraft(10)
    draft.strokes = [{ tool: 'brush', color: 'red', size: 'thick', points: [{ x: 0.2, y: 0.2 }] }]
    const repo = createMemoryCreativeRepository([draft])
    setCreativeRepositoryForTests(repo)
    const host = mount()
    await flush()
    expect(host.querySelector('.drawing')?.getAttribute('data-ready')).toBe('1')
    const undo = host.querySelector<HTMLButtonElement>('[aria-label="Отменить"]')!
    expect(undo.disabled).toBe(true)

    click(host, '[aria-label="Фон"]')
    click(host, '[data-bg-choice="color"]')
    click(host, '[data-bg-color="yellow"]')
    await flush()
    await flush()
    expect(undo.disabled).toBe(false)
    click(host, '[aria-label="Отменить"]')
    await flush()
    await flush()
    unmount()
    await flush()

    const saved = await repo.list()
    expect(saved).toHaveLength(1)
    expect(saved[0]?.id).toBe(draft.id)
    expect(saved[0]?.status).toBe('draft')
    expect(saved[0]?.strokes).toHaveLength(1)
  })

  it('удаление работы из галереи не стирает фото, которое ещё лежит под текущим листом', async () => {
    const mark = [{ tool: 'brush' as const, color: 'red' as const, size: 'thick' as const, points: [{ x: 0.2, y: 0.2 }] }]
    const older = { ...createDrawingDraft(5, { kind: 'photo', photoId: 'photo-1' }), status: 'saved' as const, strokes: mark }
    const current = createDrawingDraft(10, { kind: 'photo', photoId: 'photo-1' })
    const repo = createMemoryCreativeRepository([older, current])
    await repo.putBlob('photo-1', new Blob(['x']))
    setCreativeRepositoryForTests(repo)
    const host = mount()
    await flush()

    click(host, '[aria-label="Галерея"]')
    await flush()
    await flush()
    click(host, '.creative-gallery__open')
    await flush()
    click(host, '[data-choice="delete"]')
    await flush()
    click(host, '[data-choice="yes"]')
    await flush()
    await flush()
    expect(host.querySelectorAll('.creative-gallery__card')).toHaveLength(0)
    expect(await repo.getBlob('photo-1')).not.toBeNull()
    unmount()
  })

  it('галерея открывается под хедером, без своих фильтров; «Назад» возвращает к холсту', async () => {
    const draft = createDrawingDraft(10)
    draft.strokes = [{ tool: 'brush', color: 'white', size: 'thick', points: [{ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 }] }]
    setCreativeRepositoryForTests(createMemoryCreativeRepository([draft]))
    const host = mount()
    await flush()

    click(host, '[aria-label="Галерея"]')
    await flush()
    await flush()
    expect(host.querySelector('.drawing__screen .creative-gallery')).not.toBeNull()
    expect(host.querySelectorAll('.creative-gallery__card')).toHaveLength(1)
    expect(host.querySelector('.creative-gallery__filter')).toBeNull()
    expect(host.querySelector('.creative-gallery__close')).toBeNull()
    click(host, '[data-role="back"]')
    expect(host.querySelector('.creative-gallery')).toBeNull()
    expect(host.querySelector('[data-role="back"]')?.getAttribute('aria-label')).toBe('Назад в меню')
    unmount()
  })

  it('не теряет белый штрих после закрытия', async () => {
    const draft = createDrawingDraft(30)
    draft.strokes = [{ tool: 'brush', color: 'white', size: 'thick', points: [{ x: 0.2, y: 0.2 }] }]
    const repo = createMemoryCreativeRepository([draft])
    setCreativeRepositoryForTests(repo)
    mount()
    await flush()
    unmount()
    await flush()
    const saved = await repo.list()
    expect(saved.some((work) => work.strokes.some((stroke) => stroke.color === 'white'))).toBe(true)
  })
})

function mount(nav: { goSettings?: () => void } = {}): HTMLElement {
  const host = document.createElement('div')
  document.body.append(host)
  getGameById('drawing')!.mount(host, {
    settings: DEFAULT_SETTINGS,
    hubNavigation: { goMenu: () => undefined, goWelcome: () => undefined, ...nav },
  })
  return host
}

function unmount(): void {
  getGameById('drawing')!.unmount()
}

function click(host: HTMLElement, selector: string): void {
  const node = host.querySelector<HTMLElement>(selector)
  if (!node) throw new Error(`нет ${selector}`)
  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  node.click()
}

function pop(host: HTMLElement, id: string): HTMLElement {
  return host.querySelector<HTMLElement>(`[data-pop-id="${id}"]`)!
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
