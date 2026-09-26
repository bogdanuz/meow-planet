import { describe, expect, it } from 'vitest'
import { renderGameScreen } from '../../src/app/screens/game'

describe('coming soon', () => {
  it('несобранная игра показывает заглушку, а не модуль', () => {
    const host = document.createElement('div')
    const handle = renderGameScreen(host, 'counting', () => undefined, undefined, {
      goMenu: () => undefined,
      goWelcome: () => undefined,
    })
    expect(host.querySelector('.coming-soon')).not.toBeNull()
    expect(host.querySelector('.coming-soon__bg')?.getAttribute('src')).toContain(
      'coming-soon.jpg',
    )
    expect(host.querySelector('.counting-game')).toBeNull()
    handle?.unmount()
  })
})
