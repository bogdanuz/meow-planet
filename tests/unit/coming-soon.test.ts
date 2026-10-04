import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/content/released-games', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/content/released-games')>()),
  isGameReleased: () => false,
}))

const { renderGameScreen } = await import('../../src/app/screens/game')

describe('coming soon', () => {
  it('несобранная игра показывает заглушку, а не модуль', () => {
    const host = document.createElement('div')
    const handle = renderGameScreen(host, 'meow-home', () => undefined, undefined, {
      goMenu: () => undefined,
      goWelcome: () => undefined,
    })
    expect(host.querySelector('.coming-soon')).not.toBeNull()
    expect(host.querySelector('.coming-soon__bg')?.getAttribute('src')).toContain(
      'coming-soon.jpg',
    )
    expect(host.querySelector('.meow-home')).toBeNull()
    handle?.unmount()
  })
})
