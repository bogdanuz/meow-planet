import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { balloonPopGame } from './index'

function mountContext() {
  return {
    settings: {
      childName: '',
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 10 as const,
      balloonTasksEnabled: true,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), onSoundToggle: vi.fn() },
  }
}

describe('balloon-pop mount chrome', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
  })

  afterEach(() => {
    balloonPopGame.unmount()
  })

  it('небо на весь экран, без заголовка, дрейф как welcome', () => {
    const host = document.createElement('div')
    const ctx = mountContext()
    balloonPopGame.mount(host, ctx)
    expect(host.querySelector('.balloon-pop__title')).toBeNull()
    expect(host.querySelector('h2')).toBeNull()
    const skyArt = host.querySelector<HTMLImageElement>('.balloon-pop__sky-art')
    expect(skyArt?.src).toContain('balloon-sky-bg.webp')
    expect(skyArt?.classList.contains('balloon-pop__sky-art--drift')).toBe(true)
    expect(host.querySelector('.balloon-pop__game-bar')?.childElementCount).toBe(2)
    expect(host.querySelector('.balloon-pop__speech')?.className).toBe(
      'balloon-pop__speech',
    )
    expect(host.querySelector('[aria-label="На welcome"]')).toBeNull()
    const sound = host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')
    expect(sound).not.toBeNull()
    expect(sound?.querySelector('img.ui-icon')?.getAttribute('src')).toContain(
      'icon-sound.png',
    )
    expect(sound?.dataset.on).toBe('0')
    sound?.click()
    expect(sound?.dataset.on).toBe('1')
    expect(sound?.getAttribute('aria-label')).toBe('Звук включён')
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)
    sound?.click()
    expect(sound?.dataset.on).toBe('0')
    expect(sound?.getAttribute('aria-label')).toBe('Звук выключен')
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(false)
  })

  it('речь ниже и правее Мяу', () => {
    const css = readFileSync(path.join('src', 'games', 'balloon-pop', 'balloon-pop.css'), 'utf8')
    expect(css).toContain('calc(5.1rem - 4vh)')
    expect(css).toMatch(/margin-left:\s*1%/)
  })

  it('подсказка — неоновое свечение цвета шарика из центра, не рамка', () => {
    const host = document.createElement('div')
    balloonPopGame.mount(host, mountContext())
    const balloons = host.querySelectorAll('.balloon-pop__balloon')
    expect(balloons.length).toBeGreaterThan(0)
    for (const btn of balloons) {
      expect(btn.querySelector('.balloon-pop__glow')).not.toBeNull()
    }
    const css = readFileSync(path.join('src', 'games', 'balloon-pop', 'balloon-pop.css'), 'utf8')
    expect(css).toContain('radial-gradient')
    expect(css).toContain('balloon-neon-bloom')
    expect(css).toMatch(/\[data-color='red'\][\s\S]*--balloon-glow/)
    expect(css).toContain('outline: none')
    expect(css).toMatch(/\.balloon-pop__glow\s*\{[^}]*width:\s*54%/)
    expect(css).toContain('color-mix(in srgb, var(--balloon-glow) 86%, transparent)')
    expect(css).toMatch(/\.balloon-pop__balloon\.is-soft-highlight \.balloon-pop__glow\s*\{[^}]*opacity:\s*0\.9/)
  })
})
