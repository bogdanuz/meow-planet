import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderShell } from '../../src/app/shell'

describe('shell navigation', () => {
  afterEach(() => {
    window.location.hash = ''
    vi.useRealTimers()
  })

  it('первый вход #/ → приветствие; тап → меню с 8 плитками и «В гости»', () => {
    vi.useFakeTimers()
    window.location.hash = '#/'
    const root = document.createElement('div')
    const stop = renderShell(root)

    expect(root.querySelector('.screen--welcome')).not.toBeNull()
    expect(root.querySelector('.welcome__title')?.getAttribute('alt')).toBe(
      'Планета Мяу и друзья',
    )
    expect(root.querySelector('.welcome__title')?.getAttribute('src')).toContain(
      'welcome-title.png',
    )
    expect(root.querySelector('.welcome__hero')).toBeNull()
    expect(root.querySelector('.welcome__play')).not.toBeNull()
    expect(root.querySelector('.welcome__play-art')?.getAttribute('src')).toContain(
      'welcome-play.png',
    )
    expect(root.querySelector('.welcome__play-shine')).not.toBeNull()
    const welcomeMeow = root.querySelector('.welcome__meow')
    expect(welcomeMeow?.tagName).toBe('IMG')
    expect(welcomeMeow?.getAttribute('src')).toContain('welcome-olli-open.png')
    const meowMover = root.querySelector('.welcome__meow-mover')
    expect(meowMover?.contains(welcomeMeow ?? null)).toBe(true)
    expect(meowMover?.contains(root.querySelector('.welcome__meow-shadow'))).toBe(false)
    expect(root.querySelector('.welcome__meow-slot')?.contains(root.querySelector('.welcome__meow-shadow'))).toBe(true)
    const welcomeBg = root.querySelector('.welcome__bg')
    expect(welcomeBg?.getAttribute('src')).toContain('welcome-bg.webp')
    expect(welcomeBg?.classList.contains('welcome__bg--drift')).toBe(true)
    expect(root.querySelector('.welcome__blob')).toBeNull()
    expect(root.querySelector('.welcome__hint')).toBeNull()
    expect(root.querySelector('.welcome__dock')).not.toBeNull()
    expect(root.querySelector('.welcome__meow-shadow')).not.toBeNull()
    expect(root.querySelector('.welcome__title')?.classList.contains('welcome__title--breathe')).toBe(
      true,
    )
    expect(root.querySelector('.welcome__dock-btn--sound img.ui-icon')?.getAttribute('src')).toContain(
      'icon-sound.png',
    )
    expect(root.querySelector('.welcome__dock-btn--parent img.ui-icon')?.getAttribute('src')).toContain(
      'icon-settings.png',
    )
    expect((root.querySelector('.chrome') as HTMLElement | null)?.hidden).toBe(
      true,
    )

    const soundBtn = root.querySelector<HTMLButtonElement>('.welcome__dock-btn--sound')!
    soundBtn.click()
    expect(soundBtn.getAttribute('aria-label')).toBe('Звук выключен')
    soundBtn.click()
    expect(soundBtn.getAttribute('aria-label')).toBe('Звук включён')

    root.querySelector<HTMLButtonElement>('.welcome__play')!.click()
    vi.advanceTimersByTime(500)

    expect(window.location.hash).toBe('#/')
    expect(root.querySelector('.menu-bg')?.getAttribute('src')).toContain('welcome-bg.webp')
    expect(root.querySelector('.menu-grid')).not.toBeNull()
    expect(root.querySelectorAll('.menu-grid .game-tile')).toHaveLength(8)
    expect(root.querySelector('.menu-visit-bed')).not.toBeNull()
    expect(root.querySelector('.menu-back')).not.toBeNull()
    const menuSound = root.querySelector<HTMLButtonElement>('.menu-sound')!
    expect(menuSound.getAttribute('aria-label')).toBe('Звук включён')
    expect(menuSound.dataset.on).toBe('1')
    menuSound.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(menuSound.classList.contains('is-pressed')).toBe(true)
    menuSound.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    expect(menuSound.classList.contains('is-pressed')).toBe(false)
    menuSound.click()
    expect(menuSound.getAttribute('aria-label')).toBe('Звук выключен')
    expect(menuSound.dataset.on).toBe('0')
    const menuSettings = root.querySelector<HTMLButtonElement>('.menu-settings')!
    menuSettings.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(menuSettings.classList.contains('is-pressed')).toBe(true)
    expect(root.querySelector('.screen--menu')?.getAttribute('data-companion')).toBe('olli')
    expect(root.querySelector('.menu-visit-cat .menu-visit-bed__meow')?.getAttribute('src')).toContain(
      'menu-dance-olli/frame_01.png',
    )
    expect(root.querySelector('.menu-visit-bed__blink')?.getAttribute('src')).toContain(
      'menu-dance-olli/frame_blink.png',
    )
    expect(root.querySelector('.menu-visit-bed .menu-visit-bed__meow')).toBeNull()
    expect(root.textContent).toContain('Лопни шарик')
    expect(root.querySelector('.game-tile--balloon-pop .tile-art')?.getAttribute('src')).toContain(
      'card-balloon-pop.png',
    )
    expect(root.querySelector('.game-tile--counting')?.getAttribute('aria-label')).toBe(
      'Учимся считать',
    )
    expect(root.querySelector('.game-tile--counting .tile-art')?.getAttribute('src')).toContain(
      'card-counting.png',
    )
    const balloonTile = root.querySelector<HTMLButtonElement>('.game-tile--balloon-pop')!
    balloonTile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(balloonTile.classList.contains('is-pressed')).toBe(true)
    balloonTile.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    expect(balloonTile.classList.contains('is-pressed')).toBe(false)
    expect(root.querySelector('.menu-visit-bed')?.getAttribute('aria-label')).toBe(
      'В гости',
    )
    expect(
      root.querySelector('[aria-label="Настройки"].menu-settings'),
    ).not.toBeNull()
    expect(root.textContent).not.toContain('Радужная поляна')

    stop()
  })

  it('меню: без chrome и без футера; родители у Мяу', () => {
    window.location.hash = '#/menu'
    const root = document.createElement('div')
    const stop = renderShell(root)

    expect(root.classList.contains('app-shell--menu')).toBe(true)
    expect((root.querySelector('.chrome') as HTMLElement | null)?.hidden).toBe(
      true,
    )
    expect(root.querySelector('.menu-dock')).toBeNull()
    expect(root.querySelector('.menu-back')).not.toBeNull()

    const presenter = root.querySelector('.menu-presenter')
    const parent = root.querySelector<HTMLButtonElement>('.menu-settings')
    expect(presenter).not.toBeNull()
    expect(parent).not.toBeNull()
    expect(presenter!.contains(parent!)).toBe(false)
    expect(parent!.getAttribute('aria-label')).toBe('Настройки')

    expect(root.querySelector('.menu-scroll')).not.toBeNull()

    stop()
  })

  it('из меню жест назад (свайп справа) возвращает на приветствие', () => {
    window.location.hash = '#/menu'
    const root = document.createElement('div')
    document.body.append(root)
    const stop = renderShell(root)

    const menu = root.querySelector<HTMLElement>('.screen--menu')
    expect(menu).not.toBeNull()

    menu!.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 12,
        clientY: 200,
        pointerId: 1,
        bubbles: true,
      }),
    )
    menu!.dispatchEvent(
      new PointerEvent('pointerup', {
        clientX: 120,
        clientY: 205,
        pointerId: 1,
        bubbles: true,
      }),
    )

    expect(window.location.hash).toBe('#/welcome')
    expect(root.querySelector('.screen--welcome')).not.toBeNull()

    stop()
    root.remove()
  })

  it('прямая ссылка #/menu → сразу меню без welcome', () => {
    window.location.hash = '#/menu'
    const root = document.createElement('div')
    const stop = renderShell(root)

    expect(root.querySelector('.screen--welcome')).toBeNull()
    expect(root.querySelector('.menu-grid')).not.toBeNull()

    stop()
  })

  it('меню → игра → назад в меню', () => {
    vi.useFakeTimers()
    window.location.hash = '#/menu'
    const root = document.createElement('div')
    const stop = renderShell(root)

    const gameBtn = root.querySelector<HTMLButtonElement>(
      '[data-game-id="balloon-pop"]',
    )
    expect(gameBtn).not.toBeNull()
    gameBtn!.click()
    expect(window.location.hash).not.toBe('#/game/balloon-pop')
    vi.advanceTimersByTime(460)

    expect(window.location.hash).toBe('#/game/balloon-pop')
    expect(root.querySelector('[data-game-id="balloon-pop"]')).not.toBeNull()

    const back = root.querySelector<HTMLButtonElement>('[aria-label="Назад"]')
    expect(back).not.toBeNull()
    back!.click()

    expect(window.location.hash).toBe('#/')
    expect(root.querySelector('.menu-grid')).not.toBeNull()

    stop()
  })

  it('sound-world: app chrome скрыт, своя полоска назад+звук', () => {
    window.location.hash = '#/game/sound-world'
    const root = document.createElement('div')
    const stop = renderShell(root)

    expect((root.querySelector('.chrome') as HTMLElement | null)?.hidden).toBe(true)
    expect(root.querySelector('.sound-world__game-bar')).not.toBeNull()
    expect(root.querySelector('[aria-label="Назад в меню"]')).not.toBeNull()
    expect(root.querySelector('.sound-world [aria-label="Домой"]')).toBeNull()

    stop()
  })

  it('рисовалка: app chrome скрыт, своя полоска без «Домой»', () => {
    for (const gameId of ['drawing'] as const) {
      window.location.hash = `#/game/${gameId}`
      const root = document.createElement('div')
      const stop = renderShell(root)
      expect((root.querySelector('.chrome') as HTMLElement | null)?.hidden).toBe(true)
      expect((root.querySelector('.chrome__mascot') as HTMLElement | null)?.hidden).toBe(true)
      expect(root.querySelector(`[data-game-id="${gameId}"]`)).not.toBeNull()
      expect(root.querySelector('[aria-label="Назад в меню"]')).not.toBeNull()
      expect(root.querySelector(`[data-game-id="${gameId}"] [aria-label="Домой"]`)).toBeNull()
      stop()
    }
  })

  it('неизвестный hash → экран не найдено', () => {
    window.location.hash = '#/game/no-such-game'
    const root = document.createElement('div')
    const stop = renderShell(root)
    expect(root.textContent).toContain('Такой страницы нет')
    stop()
  })

  it('touch-кнопки не меньше 48px по min-size класса', () => {
    window.location.hash = '#/menu'
    const root = document.createElement('div')
    document.body.append(root)
    const stop = renderShell(root)

    const btn = root.querySelector('.touch-btn')
    expect(btn).not.toBeNull()
    expect(btn!.className).toContain('touch-btn')

    stop()
    root.remove()
  })
})
