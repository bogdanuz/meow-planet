import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meowHomeGame } from './index'

type Opts = { companion?: 'meow' | 'olli'; potty?: boolean; wishes?: boolean }

function mountContext(o: Opts = {}) {
  return {
    settings: {
      childName: '',
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 3 as const,
      balloonTasksEnabled: true,
      companion: o.companion ?? 'meow',
      meowHomePotty: o.potty ?? true,
      meowHomeWishes: o.wishes ?? true,
      meowHomeRealTime: false,
      meowHomeSeasonByDate: false,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), goSettings: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms)
const root = (host: HTMLElement) => host.querySelector<HTMLElement>('.meow-home')!
const speech = (host: HTMLElement) => host.querySelector('.mh__say-text')?.textContent ?? ''
const q = <T extends HTMLElement = HTMLButtonElement>(host: HTMLElement, sel: string) => host.querySelector<T>(sel)!
const think = (host: HTMLElement) => q<HTMLElement>(host, '.mh__think')

function mount(o: Opts = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const ctx = mountContext(o)
  meowHomeGame.mount(host, ctx)
  return { host, ctx }
}

async function goTo(host: HTMLElement, room: 'bath' | 'kitchen' | 'bedroom' | 'yard'): Promise<void> {
  q(host, `[data-role="door-${room}"]`).click()
  await wait(400)
  expect(root(host).dataset.room).toBe(room)
}

describe('«В гости» — экран (S16)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    meowHomeGame.unmount()
    document.body.replaceChildren()
    vi.useRealTimers()
  })

  it('вход: прихожая днём, шапка S16, двери с табличками, вешалка, персонаж машет', () => {
    const { host } = mount()
    expect(root(host).dataset.room).toBe('hall')
    expect(root(host).dataset.night).toBe('0')
    expect(q<HTMLImageElement>(host, '.mh__bg').src).toContain('bg/hall-day.webp')
    expect(q(host, '.mh__bar-nav [aria-label="Назад в меню"]')).toBeTruthy()
    expect(q(host, '.mh__bar-tools > :last-child').getAttribute('aria-label')).toBe('Настройки')
    expect(q(host, '[data-role="season"]').hidden).toBe(true)
    for (const room of ['bath', 'kitchen', 'bedroom', 'yard']) {
      expect(host.querySelector(`[data-role="door-${room}"]`)).not.toBeNull()
      expect(host.querySelector(`[data-role="plaque-${room}"]`)).not.toBeNull()
    }
    expect(host.querySelectorAll('.mh__rack-item')).toHaveLength(10)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('wave')
    expect(speech(host)).toMatch(/Привет|Ура/)
  })

  it('шестерёнка открывает раздел игры в настройках', () => {
    const { host, ctx } = mount()
    q(host, '[data-role="game-settings"]').click()
    expect(ctx.hubNavigation.goSettings).toHaveBeenCalled()
  })

  it('двери: в ванную и обратно в прихожую', async () => {
    const { host } = mount()
    await goTo(host, 'bath')
    expect(q<HTMLImageElement>(host, '.mh__bg').src).toContain('bg/bath-day.webp')
    expect(host.querySelector('[data-prop="toothbrush"]')).not.toBeNull()
    q(host, '[data-role="back"]').click()
    await wait(400)
    expect(root(host).dataset.room).toBe('hall')
  })

  it('кухня: каша → испачкался, желание «салфетка» светится; салфетка — чисто', async () => {
    const { host } = mount()
    await goTo(host, 'kitchen')
    q(host, '[data-prop="porridge"]').click()
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('eat')
    expect(speech(host)).toMatch(/вкусно|Ням/i)
    await wait(2700)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('messy')
    expect(think(host).hidden).toBe(false)
    expect(think(host).dataset.wish).toBe('messy')
    expect(q(host, '[data-prop="napkin"]').classList.contains('is-glow')).toBe(true)
    q(host, '[data-prop="napkin"]').click()
    await wait(3100)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).not.toBe('messy')
    expect(think(host).dataset.wish).toBe('teeth')
  })

  it('желание само: облачко с картинкой и светится нужная дверь', async () => {
    const { host } = mount()
    await wait(32_000)
    expect(think(host).hidden).toBe(false)
    expect(host.querySelector('.mh__door.is-glow')).not.toBeNull()
  })

  it('не помогли с желанием — облачко пропадает, персонаж снова просто стоит', async () => {
    const { host } = mount({ potty: false })
    await wait(32_000)
    expect(think(host).hidden).toBe(false)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).not.toBe('idle')
    await wait(22_000)
    expect(think(host).hidden).toBe(true)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('idle')
    expect(host.querySelector('.is-glow')).toBeNull()
  })

  it('лужа без сапог — лапки грязные; дома просит помыть, мыло — чисто', async () => {
    const { host } = mount()
    await goTo(host, 'yard')
    q(host, '[data-role="precip"]').click()
    await wait(3000)
    q(host, '.mh__puddle').click()
    expect(speech(host)).toMatch(/испачкались/)
    q(host, '[data-role="back"]').click()
    await wait(400)
    expect(root(host).dataset.room).toBe('hall')
    expect(think(host).dataset.wish).toBe('dirty')
    expect(q(host, '[data-role="door-bath"]').classList.contains('is-glow')).toBe(true)
    await goTo(host, 'bath')
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('dirty-paws')
    q(host, '[data-prop="soap"]').click()
    await wait(3100)
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).not.toBe('dirty-paws')
    expect(think(host).dataset.wish).not.toBe('dirty')
  })

  it('желания выключены в настройках — облачко не появляется', async () => {
    const { host } = mount({ wishes: false })
    await wait(130_000)
    expect(think(host).hidden).toBe(true)
  })

  it('горшок выключен — в ванной его нет', async () => {
    const { host } = mount({ potty: false })
    await goTo(host, 'bath')
    expect(host.querySelector('[data-prop="potty"]')).toBeNull()
  })

  it('окно: день ↔ ночь, фон меняется', async () => {
    const { host } = mount()
    q(host, '[data-role="window"]').click()
    expect(root(host).dataset.night).toBe('1')
    expect(q<HTMLImageElement>(host, '.mh__bg').src).toContain('bg/hall-night.webp')
  })

  it('спальня: кроватка — спит (темнеет), тап — просыпается', async () => {
    const { host } = mount()
    await goTo(host, 'bedroom')
    q(host, '[data-prop="bed"]').click()
    expect(root(host).dataset.sleep).toBe('1')
    expect(q<HTMLElement>(host, '.mh__hero').hidden).toBe(true)
    q(host, '[data-prop="bed"]').click()
    expect(root(host).dataset.sleep).toBeUndefined()
    expect(q<HTMLElement>(host, '.mh__hero').dataset.action).toBe('wake')
  })

  it('прихожая: надели куртку с вешалки — персонаж одет; тап — снимаем', () => {
    const { host } = mount()
    q(host, '[data-prop="wear-coat"]').click()
    expect(host.querySelector('.mh__doll')).not.toBeNull()
    expect(q<HTMLElement>(host, '.mh__doll').dataset.outfit).toBe('coat')
    expect(host.querySelector('[data-prop="wear-coat"]')).toBeNull()
    q(host, '.mh__hit--doll').click()
    expect(host.querySelector('.mh__doll')).toBeNull()
    expect(host.querySelector('[data-prop="wear-coat"]')).not.toBeNull()
  })

  it('двор зимой: холодно — просит шапку; корзинка — надели; дождь летом — зонтик', async () => {
    const { host } = mount()
    await goTo(host, 'yard')
    expect(q(host, '[data-role="season"]').hidden).toBe(false)
    expect(q<HTMLElement>(host, '.mh__weather').hidden).toBe(false)
    expect(root(host).dataset.season).toBe('summer')

    q(host, '[data-role="season"]').click()
    q(host, '.mh__season-choice[data-season="winter"]').click()
    expect(q<HTMLImageElement>(host, '.mh__bg').src).toContain('bg/yard-winter-day.webp')
    await wait(2000)
    expect(q<HTMLElement>(host, '.mh__doll').dataset.mood).toBe('cold')
    expect(speech(host)).toMatch(/шапку/)
    expect(think(host).dataset.wish).toBe('wear-hat')
    q(host, '[data-role="basket"]').click()
    q(host, '.mh__wear[data-wear="hat"]').click()
    expect(q<HTMLElement>(host, '.mh__doll').dataset.outfit).toBe('hat')
    expect(speech(host)).toMatch(/курточку/)

    q(host, '[data-role="season"]').click()
    q(host, '.mh__season-choice[data-season="summer"]').click()
    await wait(2000)
    q(host, '[data-role="precip"]').click()
    await wait(1200)
    expect(q<HTMLElement>(host, '.mh__doll').dataset.mood).toBe('wet')
    q(host, '.mh__wear[data-wear="umbrella"]').click()
    expect(q<HTMLElement>(host, '.mh__doll').dataset.outfit).toContain('umbrella')
  })

  it('сова говорит про клювик', async () => {
    const { host } = mount({ companion: 'olli' })
    await goTo(host, 'bath')
    q(host, '[data-prop="toothbrush"]').click()
    expect(speech(host)).toContain('Клювик')
  })
})
