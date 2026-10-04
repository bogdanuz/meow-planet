import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { puzzleGame } from './index'
import { PUZZLE_SCENES } from './logic'

function mountContext(overrides: { puzzlePieceCount?: 4 | 6 | 9; puzzleTargetHint?: boolean } = {}) {
  return {
    settings: {
      childName: '',
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 10 as const,
      balloonTasksEnabled: true,
      companion: 'olli' as const,
      puzzlePieceCount: overrides.puzzlePieceCount ?? 4,
      puzzleTargetHint: overrides.puzzleTargetHint ?? true,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), goSettings: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const cards = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.puzzle__card')]
const pieces = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.puzzle__piece:not(.is-placed)')]
const slot = (host: HTMLElement, id: number) =>
  host.querySelector<HTMLElement>(`.puzzle__slot[data-slot-id="${id}"]`)!

/** Тап → тап: кусочек и его клетка. */
function placeAll(host: HTMLElement): void {
  for (const piece of pieces(host)) {
    piece.click()
    slot(host, Number(piece.dataset.pieceId)).click()
  }
}

function openScene(host: HTMLElement, index = 0): void {
  cards(host)[index]!.click()
  vi.advanceTimersByTime(50)
}

describe('puzzle mount (S16)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
  })

  afterEach(() => {
    puzzleGame.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('рамка S16: стол на весь экран, назад + звук REF-04, без ведущего и тостов', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    puzzleGame.mount(host, ctx)
    expect(host.querySelector<HTMLImageElement>('.puzzle__bg')?.src).toContain('creative/desk-table.webp')
    const back = host.querySelector<HTMLButtonElement>('[aria-label="Назад в меню"]')!
    expect(back.classList.contains('game-chrome-btn')).toBe(true)
    expect(back.querySelector('img.ui-icon')?.getAttribute('src')).toContain('icon-back.png')
    back.click()
    expect(ctx.hubNavigation.goMenu).toHaveBeenCalled()
    const sound = host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')!
    expect(sound.classList.contains('game-chrome-btn')).toBe(true)
    sound.click()
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)
    expect(host.querySelector('.game-presenter')).toBeNull()
    expect(host.textContent).not.toContain('⚙')
  })

  it('шестерёнка в правом верхнем углу (крайняя) открывает настройки пазла', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    puzzleGame.mount(host, ctx)
    const tools = host.querySelector<HTMLElement>('.puzzle__bar-tools')!
    const gear = tools.lastElementChild as HTMLButtonElement
    expect(gear.getAttribute('aria-label')).toBe('Настройки')
    expect(gear.classList.contains('game-chrome-btn')).toBe(true)
    expect(gear.querySelector('img.ui-icon')?.getAttribute('src')).toContain('settings')
    expect(gear.hidden).toBe(false)
    gear.click()
    expect(ctx.hubNavigation.goSettings).toHaveBeenCalledTimes(1)
    openScene(host)
    expect(tools.lastElementChild).toBe(gear)
    expect(gear.hidden).toBe(false)
  })

  it('сначала экран выбора: 14 картинок с подписями, «Своё фото» — кнопка в шапке', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    expect(host.querySelector('.puzzle')?.getAttribute('data-view')).toBe('picker')
    const seen = new Set<string>()
    for (let page = 0; page < 5; page += 1) {
      for (const card of cards(host)) seen.add(card.getAttribute('aria-label') ?? '')
      const next = host.querySelector<HTMLButtonElement>('[aria-label="Следующие картинки"]')!
      if (next.disabled) break
      next.click()
    }
    for (const scene of PUZZLE_SCENES) expect(seen).toContain(scene.titleRu)
    expect(seen).not.toContain('Своё фото')
    expect(host.querySelector('.puzzle__card--add')).toBeNull()
    const addPhoto = host.querySelector<HTMLButtonElement>('.puzzle__bar-tools .puzzle__add-photo-btn')!
    expect(addPhoto.hidden).toBe(false)
    expect(addPhoto.getAttribute('aria-label')).toBe('Своё фото')
    expect(addPhoto.querySelector('.game-tool__label')?.textContent).toBe('Своё фото')
    expect(host.querySelector<HTMLButtonElement>('.puzzle__gallery-btn')?.hidden).toBe(true)
  })

  it('картинка → доска слева и кусочки на столе под углом; «Галерея» возвращает к выбору', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    openScene(host)
    expect(host.querySelector('.puzzle')?.getAttribute('data-view')).toBe('play')
    expect(host.querySelectorAll('.puzzle__slot')).toHaveLength(4)
    expect(pieces(host)).toHaveLength(4)
    for (const piece of pieces(host)) {
      expect(piece.closest('.puzzle__table')).not.toBeNull()
      expect(piece.style.getPropertyValue('--rot')).toMatch(/-?\d/)
    }
    const gallery = host.querySelector<HTMLButtonElement>('.puzzle__gallery-btn')!
    expect(gallery.hidden).toBe(false)
    expect(gallery.getAttribute('aria-label')).toBe('Галерея')
    expect(gallery.querySelector('.game-tool__label')?.textContent).toBe('Галерея')
    expect(gallery.querySelector('img')?.getAttribute('src')).toContain('creative/icons/gallery.png')
    expect(host.querySelector<HTMLButtonElement>('.puzzle__add-photo-btn')?.hidden).toBe(true)
    gallery.click()
    expect(host.querySelector('.puzzle')?.getAttribute('data-view')).toBe('picker')
  })

  it('число кусочков из настроек: 6 и 9', () => {
    for (const count of [6, 9] as const) {
      const host = document.createElement('div')
      puzzleGame.mount(host, mountContext({ puzzlePieceCount: count }))
      openScene(host)
      expect(host.querySelectorAll('.puzzle__slot')).toHaveLength(count)
      expect(pieces(host)).toHaveLength(count)
      puzzleGame.unmount()
    }
  })

  it('подсказка: взял кусочек — светится его клетка; выключена в настройках — не светится', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    openScene(host)
    const piece = pieces(host)[0]!
    piece.click()
    expect(piece.classList.contains('is-selected')).toBe(true)
    expect(slot(host, Number(piece.dataset.pieceId)).classList.contains('is-target-hint')).toBe(true)
    puzzleGame.unmount()

    const host2 = document.createElement('div')
    puzzleGame.mount(host2, mountContext({ puzzleTargetHint: false }))
    openScene(host2)
    pieces(host2)[0]!.click()
    expect(host2.querySelector('.is-target-hint')).toBeNull()
  })

  it('мимо — кусочек остаётся на столе; после трёх промахов клетка подсвечивается даже без подсказки', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext({ puzzleTargetHint: false }))
    openScene(host)
    const piece = pieces(host)[0]!
    const id = Number(piece.dataset.pieceId)
    const wrong = (id + 1) % 4
    for (let i = 0; i < 3; i += 1) {
      piece.click()
      slot(host, wrong).click()
      expect(piece.classList.contains('is-placed')).toBe(false)
      expect(piece.closest('.puzzle__table')).not.toBeNull()
    }
    expect(slot(host, id).classList.contains('is-target-hint')).toBe(true)
  })

  it('собрал — праздник, потом «Ещё» со следующей несобранной картинкой', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    openScene(host, 0)
    placeAll(host)
    const board = host.querySelector('.puzzle__board')!
    expect(board.classList.contains('is-celebrating')).toBe(true)
    const more = host.querySelector<HTMLButtonElement>('.puzzle__more')!
    expect(more.hidden).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(more.hidden).toBe(false)
    expect(more.getAttribute('aria-label')).toBe(`Ещё: ${PUZZLE_SCENES[1]!.titleRu}`)
    more.click()
    vi.advanceTimersByTime(50)
    expect(host.querySelector('.puzzle')?.getAttribute('data-scene')).toBe(PUZZLE_SCENES[1]!.id)
    expect(pieces(host)).toHaveLength(4)
    expect(more.hidden).toBe(true)
  })

  it('собрал — швов нет: доску накрывает цельная картинка, она плавно растёт, «Ещё» сбоку', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    openScene(host, 0)
    const play = host.querySelector<HTMLElement>('.puzzle__play')!
    expect(host.querySelector('.puzzle__board-full')).toBeNull()
    placeAll(host)
    const full = host.querySelector<HTMLElement>('.puzzle__board .puzzle__board-full')!
    expect(full).not.toBeNull()
    expect(full.style.backgroundImage).toContain(PUZZLE_SCENES[0]!.id)
    expect(full.getAttribute('aria-hidden')).toBe('true')
    expect(play.classList.contains('is-finale')).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(play.classList.contains('is-finale')).toBe(true)
    vi.advanceTimersByTime(2000)
    const more = host.querySelector<HTMLButtonElement>('.puzzle__more')!
    expect(more.hidden).toBe(false)
    more.click()
    vi.advanceTimersByTime(50)
    expect(play.classList.contains('is-finale')).toBe(false)
    expect(host.querySelector('.puzzle__board-full')).toBeNull()
  })

  it('собранная картинка отмечена звёздочкой на экране выбора', () => {
    const host = document.createElement('div')
    puzzleGame.mount(host, mountContext())
    openScene(host, 2)
    placeAll(host)
    vi.advanceTimersByTime(3000)
    host.querySelector<HTMLButtonElement>('.puzzle__gallery-btn')!.click()
    expect(cards(host)[2]!.classList.contains('is-solved')).toBe(true)
    expect(cards(host)[0]!.classList.contains('is-solved')).toBe(false)
  })
})
