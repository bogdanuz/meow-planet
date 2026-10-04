import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SORT_ART_READY } from './art-ready'
import { sortColorsGame } from './index'

function mountContext(childName = '') {
  return {
    settings: {
      childName,
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 10 as const,
      balloonTasksEnabled: true,
      companion: 'olli' as const,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const toys = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.sort-colors__pile .sort-colors__toy')]
const bins = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.sort-colors__bin')]
const speech = (host: HTMLElement) => host.querySelector('.game-presenter__speech')?.textContent ?? ''
const binFor = (host: HTMLElement, kind: string) =>
  host.querySelector<HTMLButtonElement>(`.sort-colors__bin[data-kind="${kind}"]`)!
const wrongBinFor = (host: HTMLElement, kind: string) => bins(host).find((b) => b.dataset.kind !== kind)!

describe('sort-colors mount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    })
  })

  afterEach(() => {
    sortColorsGame.unmount()
    vi.useRealTimers()
  })

  it('рамка S16: фон на весь экран, назад + звук REF-04, режимы, свой ведущий', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    sortColorsGame.mount(host, ctx)
    expect(host.querySelector('h2')).toBeNull()
    expect(host.querySelector<HTMLImageElement>('.sort-colors__bg')?.src).toContain(
      SORT_ART_READY.background ? 'sort-playroom-bg.webp' : 'menu-bg.webp',
    )
    const back = host.querySelector<HTMLButtonElement>('[aria-label="Назад в меню"]')!
    expect(back.classList.contains('game-chrome-btn')).toBe(true)
    expect(back.querySelector('img.ui-icon')?.getAttribute('src')).toContain('icon-back.png')
    back.click()
    expect(ctx.hubNavigation.goMenu).toHaveBeenCalled()
    const sound = host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')!
    expect(sound.dataset.on).toBe('0')
    sound.click()
    expect(sound.dataset.on).toBe('1')
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)
    const modes = [...host.querySelectorAll<HTMLButtonElement>('.sort-colors__mode-btn')]
    expect(modes.map((b) => b.textContent)).toEqual(['Свободно', 'Задание'])
    expect(modes[0]!.getAttribute('aria-pressed')).toBe('true')
    expect(host.querySelector('.sort-colors .game-presenter')?.getAttribute('data-companion')).toBe('olli')
  })

  it('свободный режим: 4 ящика с наклейками, куча из 12, приветствие с именем', () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext('Маша'))
    expect(bins(host)).toHaveLength(4)
    for (const bin of bins(host)) expect(bin.querySelector('.sort-colors__sticker')).not.toBeNull()
    expect(toys(host)).toHaveLength(12)
    expect(speech(host).startsWith('Маша, ')).toBe(true)
  })

  it('тап по игрушке → тап по своему ящику: игрушка в ящике, похвала', () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext())
    const toy = toys(host)[0]!
    const kind = toy.dataset.kind!
    toy.click()
    expect(toy.classList.contains('is-selected')).toBe(true)
    binFor(host, kind).click()
    expect(binFor(host, kind).querySelector(`[data-toy-id="${toy.dataset.toyId}"]`)).not.toBeNull()
    expect(toys(host)).toHaveLength(11)
    expect(speech(host)).toMatch(/!/)
  })

  it('чужой ящик: игрушка возвращается, после 2 промахов подсвечен нужный', () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext())
    const toy = toys(host)[0]!
    const kind = toy.dataset.kind!
    toy.click()
    wrongBinFor(host, kind).click()
    expect(toys(host)).toContain(toy)
    expect(speech(host)).toMatch(/ящик/)
    expect(binFor(host, kind).classList.contains('is-soft-highlight')).toBe(false)
    toy.click()
    wrongBinFor(host, kind).click()
    expect(binFor(host, kind).classList.contains('is-soft-highlight')).toBe(true)
    expect(speech(host)).toMatch(/^Смотри, вот ящик/)
    toy.click()
    binFor(host, kind).click()
    expect(binFor(host, kind).classList.contains('is-soft-highlight')).toBe(false)
  })

  it('куча разобрана → праздник → новая куча', async () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext())
    const root = host.querySelector<HTMLElement>('.sort-colors')!
    const round = root.dataset.round
    for (const toy of toys(host)) {
      toy.click()
      binFor(host, toy.dataset.kind!).click()
    }
    expect(toys(host)).toHaveLength(0)
    expect(speech(host)).toMatch(/Все игрушки|Всё разложено/)
    await vi.advanceTimersByTimeAsync(4000)
    expect(root.dataset.round).not.toBe(round)
    expect(toys(host)).toHaveLength(12)
  })

  it('режим «Задание»: маленькая куча, ящики только для видов на экране, текст задания', () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext())
    const taskBtn = [...host.querySelectorAll<HTMLButtonElement>('.sort-colors__mode-btn')][1]!
    taskBtn.click()
    const root = host.querySelector<HTMLElement>('.sort-colors')!
    expect(root.dataset.mode).toBe('task')
    expect(root.dataset.taskType).toBe('one')
    expect(toys(host).length).toBe(5)
    const kindsOnScreen = new Set(toys(host).map((t) => t.dataset.kind))
    expect(new Set(bins(host).map((b) => b.dataset.kind))).toEqual(kindsOnScreen)
    expect(speech(host)).toMatch(/[Пп]оложи/)
  })

  it('задание выполнено → следующее задание', async () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, mountContext())
    ;[...host.querySelectorAll<HTMLButtonElement>('.sort-colors__mode-btn')][1]!.click()
    const root = host.querySelector<HTMLElement>('.sort-colors')!
    const kind = root.dataset.taskKind!
    const round = root.dataset.round
    const target = toys(host).find((t) => t.dataset.kind === kind)!
    target.click()
    binFor(host, kind).click()
    expect(speech(host)).toMatch(/Всё получилось/)
    await vi.advanceTimersByTimeAsync(4000)
    expect(root.dataset.round).not.toBe(round)
    expect(root.dataset.mode).toBe('task')
  })
})
