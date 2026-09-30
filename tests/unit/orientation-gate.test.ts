import { afterEach, describe, expect, it } from 'vitest'
import { HOME_SCREEN_HINT } from '../../src/app/home-screen-hint'
import { isLandscape, mountOrientationGate } from '../../src/app/orientation-gate'
import { mountSmallViewportGate } from '../../src/app/small-viewport-gate'

describe('orientation gate', () => {
  afterEach(() => {
    document.body.className = ''
    document.documentElement.className = ''
    document.body.replaceChildren()
  })

  it('в книжной ориентации показывает оверлей', () => {
    Object.defineProperty(window, 'innerWidth', { value: 700, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })

    expect(isLandscape()).toBe(false)
    const stop = mountOrientationGate(document.body)
    const gate = document.querySelector('.orientation-gate') as HTMLElement
    expect(gate).not.toBeNull()
    expect(gate.hidden).toBe(false)
    expect(document.body.classList.contains('is-portrait-blocked')).toBe(true)
    expect(gate.textContent).toContain(HOME_SCREEN_HINT)
    stop()
  })

  it('маленький экран подсказывает сохранить ярлык на рабочий стол', () => {
    const stop = mountSmallViewportGate(document.body)
    const gate = document.querySelector('.orientation-gate')
    expect(gate?.textContent).toContain('Планета Мяу ждёт тебя на планшете')
    expect(gate?.textContent).toContain(HOME_SCREEN_HINT)
    stop()
  })

  it('в альбомной ориентации оверлей скрыт', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })

    expect(isLandscape()).toBe(true)
    const stop = mountOrientationGate(document.body)
    const gate = document.querySelector('.orientation-gate') as HTMLElement
    expect(gate.hidden).toBe(true)
    stop()
  })
})
