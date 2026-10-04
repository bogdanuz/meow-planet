import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hideSeekGame } from './index'
import { HIDE_SCENES } from './scenes'
import {
  IDLE_LINES,
  NEAR_LINES,
  NEXT_LINES,
  OTHER_LINES,
  PRAISE_LINES,
  ROUND_DONE_LINES,
  START_LINES,
} from './phrases'
import { GALLERY_STAR_KEYS } from '../../shared/gallery-progress'

type Level = 'easy' | 'medium' | 'hard'

function mountContext(overrides: { level?: Level; mirror?: boolean; hints?: boolean } = {}) {
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
      hideSeekLevel: overrides.level ?? 'easy',
      hideSeekMirror: overrides.mirror ?? false,
      hideSeekAutoHints: overrides.hints ?? true,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), goSettings: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const WHERE = /^Где спрятал(ся|ась|ось) .+\?$/
const texts = (lines: readonly { text: string }[]) => lines.map((l) => l.text)

const cards = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.hide-seek__card')]
const speech = (host: HTMLElement) => host.querySelector('.game-presenter__speech')?.textContent ?? ''
const currentId = (host: HTMLElement) => host.querySelector<HTMLElement>('.hide-seek')!.dataset.wanted ?? ''
const hit = (host: HTMLElement, id: string) =>
  host.querySelector<HTMLButtonElement>(`.hide-seek__spot[data-item-id="${id}"] .hide-seek__hit`)!
const targetIds = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLElement>('.hide-seek__strip-card')].map((c) => c.dataset.itemId!)
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms)

async function openScene(host: HTMLElement, index = 0): Promise<void> {
  cards(host)[index]!.click()
  await wait(2600)
}

/** Нашёл текущий предмет и дождался следующего задания (находка → похвала/«дальше» → задание). */
async function findCurrent(host: HTMLElement): Promise<void> {
  hit(host, currentId(host)).click()
  await wait(3200)
}

describe('hide-seek mount (S16)', () => {
  let stored: Map<string, string>

  beforeEach(() => {
    vi.useFakeTimers()
    stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
  })

  afterEach(() => {
    hideSeekGame.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('шапка S16: назад + звук слева; справа «Галерея» и шестерёнка (крайняя)', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    hideSeekGame.mount(host, ctx)
    const back = host.querySelector<HTMLButtonElement>('[aria-label="Назад в меню"]')!
    expect(back.classList.contains('game-chrome-btn')).toBe(true)
    back.click()
    expect(ctx.hubNavigation.goMenu).toHaveBeenCalled()
    host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')!.click()
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)
    const tools = host.querySelector<HTMLElement>('.hide-seek__bar-tools')!
    const last = tools.lastElementChild as HTMLButtonElement
    expect(last.dataset.role).toBe('game-settings')
    last.click()
    expect(ctx.hubNavigation.goSettings).toHaveBeenCalled()
  })

  it('сначала галерея: 6 сцен, звёздочка у пройденных', () => {
    stored.set(GALLERY_STAR_KEYS['hide-seek'], '["kitchen"]')
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    expect(host.querySelector<HTMLElement>('.hide-seek')!.dataset.view).toBe('gallery')
    expect(cards(host).map((c) => c.dataset.sceneId)).toEqual(HIDE_SCENES.map((s) => s.id))
    expect(cards(host)[1]!.querySelector('.hide-seek__card-star')).not.toBeNull()
    expect(cards(host)[0]!.querySelector('.hide-seek__card-star')).toBeNull()
  })

  it('сцена: картинка на весь экран, на «Легко» предметы видны целиком, ведущий знакомит и спрашивает «Где…?»', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ level: 'easy' }))
    cards(host)[1]!.click()
    const root = host.querySelector<HTMLElement>('.hide-seek')!
    expect(root.dataset.view).toBe('play')
    expect(root.dataset.scene).toBe('kitchen')
    expect(host.querySelector<HTMLImageElement>('.hide-seek__scene')!.src).toContain('scenes/kitchen.webp')
    expect(host.querySelectorAll('.hide-seek__spot[data-role="target"]')).toHaveLength(3)
    expect(host.querySelectorAll('.hide-seek__strip-card')).toHaveLength(3)
    expect(host.querySelectorAll('.hide-seek__patch')).toHaveLength(0)
    expect(speech(host)).toBe('Мы на кухне! Тут кто-то прячется…')
    await wait(2600)
    expect(speech(host)).toMatch(WHERE)
    expect(host.querySelector<HTMLImageElement>('.hide-seek__wanted img')!.src).toContain(`kitchen-${currentId(host)}.png`)
  })

  it('«Средне»: 4 предмета, каждый наполовину за укрытием', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ level: 'medium' }))
    await openScene(host, 0)
    expect(host.querySelectorAll('.hide-seek__spot[data-role="target"]')).toHaveLength(4)
    expect(host.querySelectorAll('.hide-seek__patch')).toHaveLength(4)
    expect(host.querySelector('.hide-seek__spot[data-kuku="1"]')).toBeNull()
  })

  it('«Сложно»: 5 + обманка', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ level: 'hard' }))
    await openScene(host, 4)
    expect(host.querySelectorAll('.hide-seek__spot[data-role="target"]')).toHaveLength(5)
    expect(host.querySelectorAll('.hide-seek__spot[data-role="decoy"]')).toHaveLength(1)
  })

  it('нашёл: «Вот он…!», затем похвала или «дальше», затем следующее «Где…?»', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 0)
    const first = currentId(host)
    hit(host, first).click()
    expect(host.querySelector(`.hide-seek__spot[data-item-id="${first}"]`)!.classList.contains('is-found')).toBe(true)
    expect(speech(host)).toMatch(/^Вот (он|она|оно), .+!$/)
    await wait(2000)
    expect([...texts(PRAISE_LINES), ...texts(NEXT_LINES)]).toContain(speech(host))
    await wait(1200)
    expect(host.querySelector(`.hide-seek__strip-card[data-item-id="${first}"]`)!.classList.contains('is-found')).toBe(true)
    expect(currentId(host)).not.toBe(first)
    expect(speech(host)).toMatch(WHERE)
  })

  it('другой предмет раунда засчитывается, задание остаётся', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 2)
    const wanted = currentId(host)
    const other = targetIds(host).find((id) => id !== wanted)!
    hit(host, other).click()
    expect(host.querySelector(`.hide-seek__spot[data-item-id="${other}"]`)!.classList.contains('is-found')).toBe(true)
    await wait(2400)
    expect(texts(OTHER_LINES)).toContain(speech(host))
    expect(currentId(host)).toBe(wanted)
  })

  it('мимо: мягко; после двух промахов — «где-то рядом» и предмет выглядывает', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 3)
    const stage = host.querySelector<HTMLElement>('.hide-seek__stage')!
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5 }))
    expect(host.querySelector('.hide-seek__ripple')).not.toBeNull()
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 6, clientY: 6 }))
    expect(texts(NEAR_LINES)).toContain(speech(host))
    expect(host.querySelector(`.hide-seek__spot[data-item-id="${currentId(host)}"]`)!.classList.contains('is-peek')).toBe(true)
  })

  it('подсказки сами: 6 с — повтор «Где…?», 12 с — сияние и «Загляни…»; выключены — тишина', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 0)
    await wait(6100)
    expect(speech(host)).toMatch(WHERE)
    await wait(6100)
    expect(host.querySelector('.hide-seek__glow')!.classList.contains('is-on')).toBe(true)
    expect(texts(IDLE_LINES)).toContain(speech(host))
    hideSeekGame.unmount()

    const quiet = document.createElement('div')
    hideSeekGame.mount(quiet, mountContext({ hints: false }))
    await openScene(quiet, 0)
    await wait(13000)
    expect(speech(quiet)).toMatch(WHERE)
    expect(quiet.querySelector('.hide-seek__glow')!.classList.contains('is-on')).toBe(false)
  })

  it('кнопка «Подсказка» работает всегда', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ hints: false }))
    await openScene(host, 0)
    host.querySelector<HTMLButtonElement>('[data-role="hint"]')!.click()
    expect(host.querySelector('.hide-seek__glow')!.classList.contains('is-on')).toBe(true)
  })

  it('«ку-ку» только на «Сложно»: тап по укрытию — предмет выпрыгивает', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ level: 'hard' }))
    await openScene(host, 0)
    const spot = host.querySelector<HTMLElement>('.hide-seek__spot[data-kuku="1"]')!
    expect(spot).not.toBeNull()
    spot.querySelector<HTMLButtonElement>('.hide-seek__hit')!.click()
    expect(spot.classList.contains('is-found')).toBe(true)
  })

  it('все нашлись: праздник, звёздочка у сцены, «Ещё» — следующая без звёздочки', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 0)
    for (let i = 0; i < 3; i += 1) await findCurrent(host)
    expect(texts(ROUND_DONE_LINES)).toContain(speech(host))
    expect(JSON.parse(stored.get(GALLERY_STAR_KEYS['hide-seek'])!)).toEqual(['room'])
    await wait(3000)
    const more = host.querySelector<HTMLButtonElement>('.hide-seek__more')!
    expect(more.hidden).toBe(false)
    more.click()
    expect(host.querySelector<HTMLElement>('.hide-seek')!.dataset.scene).toBe('kitchen')
    expect(speech(host)).toBe('Мы на кухне! Тут кто-то прячется…')
  })

  it('«Заново» — та же сцена, новый раунд, ведущий зовёт играть; «Галерея» — назад к сценам', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext())
    await openScene(host, 5)
    host.querySelector<HTMLButtonElement>('[data-role="again"]')!.click()
    expect(host.querySelector<HTMLElement>('.hide-seek')!.dataset.scene).toBe('playground')
    expect(host.querySelectorAll('.hide-seek__spot[data-role="target"]')).toHaveLength(3)
    expect(texts(START_LINES)).toContain(speech(host))
    host.querySelector<HTMLButtonElement>('[data-role="gallery"]')!.click()
    expect(host.querySelector<HTMLElement>('.hide-seek')!.dataset.view).toBe('gallery')
  })

  it('зеркало: при включённой настройке сцена иногда отражена', async () => {
    const host = document.createElement('div')
    hideSeekGame.mount(host, mountContext({ mirror: true }))
    const seen = new Set<string>()
    for (let i = 0; i < 30; i += 1) {
      await openScene(host, 0)
      seen.add(host.querySelector<HTMLElement>('.hide-seek')!.dataset.mirrored ?? '')
      host.querySelector<HTMLButtonElement>('[data-role="gallery"]')!.click()
    }
    expect(seen).toEqual(new Set(['0', '1']))
  })
})
