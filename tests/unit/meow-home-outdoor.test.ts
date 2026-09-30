import { describe, expect, it } from 'vitest'
import { getGameById } from '../../src/games/registry'
import { isGameReleased } from '../../src/content/released-games'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

describe('«В гости»: дверь на улицу', () => {
  it('дверь ведёт на улицу с временами года, «Домой» возвращает в дом', () => {
    const game = getGameById('meow-home')!
    expect(game.meta.modules).toContain('2.10')
    expect(isGameReleased('meow-home')).toBe(false)

    const host = document.createElement('div')
    const hints: string[] = []
    game.mount(host, { settings: DEFAULT_SETTINGS, onSoftHint: (text) => hints.push(text) })

    const door = host.querySelector<HTMLButtonElement>('[aria-label="На улицу"]')
    expect(door).not.toBeNull()
    door!.click()
    expect(host.querySelector('.seasons-game')).not.toBeNull()
    expect(host.querySelector<HTMLElement>('.meow-home__stage')?.hidden).toBe(true)
    expect(host.querySelectorAll('.seasons-game__season-pick')).toHaveLength(4)
    expect(hints.at(-1)).toContain('сезон')

    host.querySelector<HTMLButtonElement>('[aria-label="Зима"]')!.click()
    expect(host.querySelector<HTMLElement>('.seasons-game__snowman')?.hidden).toBe(false)

    host.querySelector<HTMLButtonElement>('[aria-label="Домой"]')!.click()
    expect(host.querySelector('.seasons-game')).toBeNull()
    expect(host.querySelector<HTMLElement>('.meow-home__stage')?.hidden).toBe(false)
    game.unmount()
    expect(host.querySelector('[data-game-id="meow-home"]')).toBeNull()
  })
})
