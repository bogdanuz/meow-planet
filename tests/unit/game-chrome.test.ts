import { describe, expect, it, vi } from 'vitest'
import {
  createGameChromeButton,
  createGameSettingsButton,
  createGameToolButton,
  gameToolIconUrl,
} from '../../src/shared/game-chrome'

describe('game chrome — общие кнопки игр', () => {
  it('круглая кнопка REF-04: назад/звук/настройки', () => {
    const onClick = vi.fn()
    const btn = createGameChromeButton('Назад в меню', 'back', onClick)
    expect(btn.classList.contains('game-chrome-btn')).toBe(true)
    expect(btn.classList.contains('touch-btn')).toBe(true)
    expect(btn.getAttribute('aria-label')).toBe('Назад в меню')
    expect(btn.querySelector('img.ui-icon')?.getAttribute('src')).toContain('back')
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('шестерёнка открывает настройки игры, без навигации — скрыта', () => {
    const goSettings = vi.fn()
    const gear = createGameSettingsButton(goSettings)
    expect(gear.getAttribute('aria-label')).toBe('Настройки')
    expect(gear.classList.contains('game-chrome-btn')).toBe(true)
    expect(gear.dataset.role).toBe('game-settings')
    expect(gear.querySelector('img.ui-icon')?.getAttribute('src')).toContain('settings')
    expect(gear.hidden).toBe(false)
    gear.click()
    expect(goSettings).toHaveBeenCalledTimes(1)

    expect(createGameSettingsButton(undefined).hidden).toBe(true)
  })

  it('инструмент в шапке: иконка + подпись, «Галерея» — одна иконка во всех играх', () => {
    const onClick = vi.fn()
    const btn = createGameToolButton('Галерея', 'gallery', onClick)
    expect(btn.classList.contains('game-tool')).toBe(true)
    expect(btn.getAttribute('aria-label')).toBe('Галерея')
    expect(btn.querySelector('.game-tool__label')?.textContent).toBe('Галерея')
    expect(btn.querySelector<HTMLImageElement>('img.game-tool__icon')?.getAttribute('src')).toMatch(
      /assets\/games\/creative\/icons\/gallery\.png$/,
    )
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(gameToolIconUrl('background')).toMatch(/creative\/icons\/background\.png$/)
  })
})
