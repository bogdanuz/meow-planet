import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundWorldGame } from './index'
import { DEFAULT_SETTINGS } from '../../shared/storage'
import { isMusicDucked } from '../../shared/audio-engine'

function mountContext() {
  return {
    settings: { ...DEFAULT_SETTINGS, soundEnabled: false, musicEnabled: false },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), onSoundToggle: vi.fn() },
  }
}

describe('sound-world mount chrome', () => {
  afterEach(() => {
    soundWorldGame.unmount()
  })

  it('фон меню на весь экран, назад и звук, без заголовка и домика', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    soundWorldGame.mount(host, ctx)

    expect(host.querySelector('h1')).toBeNull()
    expect(host.querySelector('h2')).toBeNull()
    expect(host.querySelector('[aria-label="Домой"]')).toBeNull()
    const bg = host.querySelector<HTMLImageElement>('.sound-world__bg')
    expect(bg?.src).toContain('menu-bg.webp')
    expect(host.querySelector('[aria-label="Назад в меню"]')).not.toBeNull()
    const sound = host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')
    expect(sound?.querySelector('img.ui-icon')?.getAttribute('src')).toContain(
      'icon-sound.png',
    )
    sound?.click()
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)

    expect(host.querySelectorAll('.sound-world__card').length).toBe(6)
    expect(host.querySelectorAll('.sound-world__page-dot').length).toBe(3)
    expect(host.querySelector('.sound-world__bar-start .sound-world__pager')).not.toBeNull()
    expect(host.querySelector('.sound-world__game-bar .sound-world__letter-lang')).not.toBeNull()
    expect(
      host.querySelector<HTMLElement>('.sound-world__letter-lang')?.hidden,
    ).toBe(true)
    const catArt = host.querySelector<HTMLImageElement>('[data-card-id="cat"] img.sound-world__art')
    expect(catArt?.getAttribute('src')).toContain('cards/cat.png')
    expect(host.querySelector('[data-card-id="cat"] .ph')).toBeNull()

    const css = readFileSync(path.join('src', 'games', 'sound-world', 'sound-world.css'), 'utf8')
    expect(css).toContain('width: 4.5rem')
    expect(css).toContain('object-fit: cover')
    expect(css).toContain('font-size: 1.2rem')
    expect(css).toContain('drop-shadow')
    expect(css).toContain('max-height: 92%')
    expect(css).toMatch(/\.sound-world__page-dot\s*\{[^}]*width:\s*2\.75rem/)
    expect(css).toMatch(/\.sound-world__pager\s*\{[^}]*position:\s*relative/)
    expect(css).toMatch(/\.sound-world__label\s*\{[^}]*z-index:\s*2/)
    expect(css).toContain('flex-wrap: nowrap')
    expect(css).toMatch(/\.sound-world__pager\[hidden\]\s*\{[^}]*display:\s*none/)
    expect(css).toMatch(
      /\.sound-world__grid--instruments \.sound-world__card\.touch-btn\s*\{[^}]*height:\s*auto/,
    )
    expect(css).toContain('prefers-reduced-motion')
  })

  it('инструменты: 5 карточек, класс 3+2, без точек страниц', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    host.querySelector<HTMLButtonElement>('[data-main-tab="instruments"]')?.click()
    const grid = host.querySelector<HTMLElement>('.sound-world__grid')
    expect(grid?.classList.contains('sound-world__grid--instruments')).toBe(true)
    expect(host.querySelectorAll('.sound-world__card').length).toBe(5)
    expect(host.querySelector('[data-card-id="drum"] .sound-world__label')).toBeNull()
    expect(host.querySelector<HTMLElement>('.sound-world__pager')?.hidden).toBe(true)
    expect(host.querySelectorAll('.sound-world__page-dot').length).toBe(0)
  })

  it('буквы RU: 33 плитки, сетка алфавита, РУ/ABC видны', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    host.querySelector<HTMLButtonElement>('[data-main-tab="letters-ru"]')?.click()
    const grid = host.querySelector<HTMLElement>('.sound-world__grid')
    expect(grid?.classList.contains('sound-world__grid--alphabet')).toBe(true)
    expect(host.querySelectorAll('.sound-world__card--letter').length).toBe(33)
    expect(host.querySelector<HTMLElement>('.sound-world__pager')?.hidden).toBe(true)
    const lang = host.querySelector<HTMLElement>('.sound-world__letter-lang')
    expect(lang?.hidden).toBe(false)
    expect(lang?.querySelector('[data-letter-script="ru"]')).not.toBeNull()
  })

  it('свайп по карточке не меняет страницу животных', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    const card = host.querySelector('[data-card-id="cat"]')
    expect(card).not.toBeNull()
    card!.dispatchEvent(new PointerEvent('pointerdown', { clientX: 240, bubbles: true }))
    card!.dispatchEvent(new PointerEvent('pointerup', { clientX: 40, bubbles: true }))
    expect(host.querySelector('[data-card-id="cat"]')).not.toBeNull()
    expect(host.querySelector('[data-card-id="sheep"]')).toBeNull()
  })

  it('в инструменте стрелка назад возвращает к сетке, не в меню', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    soundWorldGame.mount(host, ctx)
    host.querySelector<HTMLButtonElement>('[data-main-tab="instruments"]')?.click()
    host.querySelector<HTMLButtonElement>('[data-card-id="drum"]')?.click()
    expect(host.querySelector('.sound-world__instrument')).not.toBeNull()
    expect(host.textContent).not.toContain('К инструментам')
    const back = host.querySelector<HTMLButtonElement>('[aria-label="К инструментам"]')
    expect(back).not.toBeNull()
    back!.click()
    expect(ctx.hubNavigation.goMenu).not.toHaveBeenCalled()
    expect(host.querySelector('[data-card-id="drum"]')).not.toBeNull()
  })

  it('внутри инструмента музыка затихает, у списка инструментов — возвращается', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    expect(isMusicDucked()).toBe(false)
    host.querySelector<HTMLButtonElement>('[data-main-tab="instruments"]')?.click()
    host.querySelector<HTMLButtonElement>('[data-card-id="piano"]')?.click()
    expect(isMusicDucked()).toBe(true)
    host.querySelector<HTMLButtonElement>('[aria-label="К инструментам"]')?.click()
    expect(isMusicDucked()).toBe(false)
  })

  it('выход из игры прямо из инструмента возвращает музыку', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    host.querySelector<HTMLButtonElement>('[data-main-tab="instruments"]')?.click()
    host.querySelector<HTMLButtonElement>('[data-card-id="piano"]')?.click()
    expect(isMusicDucked()).toBe(true)
    soundWorldGame.unmount()
    expect(isMusicDucked()).toBe(false)
  })

  it('барабан — три цели по центру, без бубна в сетке', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    expect(host.querySelector('[data-card-id="tambourine"]')).toBeNull()
    host.querySelector<HTMLButtonElement>('[data-main-tab="instruments"]')?.click()
    expect(host.querySelectorAll('.sound-world__card').length).toBe(5)
    const drumCard = host.querySelector<HTMLImageElement>(
      '[data-card-id="drum"] img.sound-world__art',
    )
    expect(drumCard?.getAttribute('src')).toContain('cards/drum.png')
    host.querySelector<HTMLButtonElement>('[data-card-id="drum"]')?.click()
    expect(host.querySelectorAll('.sound-world__drum-pad').length).toBe(3)
    expect(host.querySelector('.sound-world__drum-floor')).not.toBeNull()
    expect(host.querySelector('.sound-world__drum-ground')).not.toBeNull()
    const snareArt = host.querySelector<HTMLImageElement>(
      '.sound-world__drum-pad--snare .sound-world__layer-art',
    )
    expect(snareArt?.getAttribute('src')).toContain('play/drum-snare.png')
    const grid = host.querySelector<HTMLElement>('.sound-world__grid')
    expect(grid?.hidden).toBe(true)
    expect(getComputedStyle(grid!).display).toBe('none')
    const css = readFileSync(path.join('src', 'games', 'sound-world', 'sound-world.css'), 'utf8')
    expect(css).toMatch(/\.sound-world__instrument\s*\{[^}]*align-items:\s*center/)
    expect(css).toContain('box-sizing: border-box')
    expect(css).toContain('72vh * 1.6 * 1.5')
    expect(host.querySelector('.sound-world__drum-floor')?.getAttribute('style')).toContain(
      'drum-floor.png',
    )
  })

  it('буквы — PNG глифы с листа', () => {
    const host = document.createElement('div')
    soundWorldGame.mount(host, mountContext())
    host.querySelector<HTMLButtonElement>('[data-main-tab="letters-ru"]')?.click()
    const glyph = host.querySelector<HTMLImageElement>(
      '[data-card-id="ru-А"] img.sound-world__art',
    )
    expect(glyph?.getAttribute('src')).toContain('letters/ru-01.png')
    expect(host.querySelector('.sound-world__letter-glyph')).toBeNull()
  })
})
