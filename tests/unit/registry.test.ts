import { describe, expect, it } from 'vitest'
import { GAME_IDS, ZONE_IDS } from '../../src/content/catalog'
import {
  GAME_REGISTRY,
  getGameById,
  listAllGameIds,
  listGamesByZone,
} from '../../src/games/registry'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

describe('game registry', () => {
  it('содержит все игры каталога', () => {
    expect(GAME_REGISTRY).toHaveLength(9)
    expect(listAllGameIds()).toHaveLength(9)
  })

  it('все ID уникальны и совпадают с каталогом', () => {
    const ids = listAllGameIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual([...GAME_IDS].sort())
  })

  it('у каждой игры есть зона из каталога', () => {
    for (const game of GAME_REGISTRY) {
      expect(ZONE_IDS).toContain(game.meta.zoneId)
      expect(game.meta.title.length).toBeGreaterThan(0)
      expect(game.meta.modules.length).toBeGreaterThan(0)
    }
  })

  it('getGameById возвращает модуль и undefined для неизвестного', () => {
    expect(getGameById('balloon-pop')?.meta.title).toBe('Лопни шарик')
    expect(getGameById('missing-game' as never)).toBeUndefined()
  })

  it('listGamesByZone отдаёт игры только своей зоны', () => {
    const workshop = listGamesByZone('star-workshop')
    expect(workshop.map((g) => g.meta.id).sort()).toEqual(
      ['counting', 'drawing', 'puzzle', 'shape-build', 'sort-colors'].sort(),
    )
    expect(listGamesByZone('sound-grove')).toHaveLength(1)
  })

  it('balloon-pop mount/unmount рисует поле шариков', () => {
    const game = getGameById('balloon-pop')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="balloon-pop"]')).not.toBeNull()
    expect(host.querySelectorAll('.balloon-pop__balloon').length).toBeGreaterThan(0)
    game!.unmount()
    expect(host.querySelector('[data-game-id="balloon-pop"]')).toBeNull()
  })

  it('sort-colors mount/unmount рисует корзинки и бусины', () => {
    const game = getGameById('sort-colors')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="sort-colors"]')).not.toBeNull()
    expect(host.querySelectorAll('.sort-colors__basket')).toHaveLength(5)
    expect(host.querySelectorAll('.sort-colors__bead')).toHaveLength(10)
    game!.unmount()
    expect(host.querySelector('[data-game-id="sort-colors"]')).toBeNull()
  })

  it('shape-build mount/unmount рисует доску и фигуры', () => {
    const game = getGameById('shape-build')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="shape-build"]')).not.toBeNull()
    expect(host.querySelectorAll('.shape-build__slot').length).toBeGreaterThan(0)
    expect(host.querySelectorAll('.shape-build__piece').length).toBeGreaterThan(0)
    game!.unmount()
    expect(host.querySelector('[data-game-id="shape-build"]')).toBeNull()
  })

  it('hide-seek mount/unmount рисует сцену', () => {
    const game = getGameById('hide-seek')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="hide-seek"]')).not.toBeNull()
    expect(host.querySelectorAll('.hide-seek__target').length).toBeGreaterThan(0)
    game!.unmount()
    expect(host.querySelector('[data-game-id="hide-seek"]')).toBeNull()
  })

  it('counting mount/unmount рисует режимы', () => {
    const game = getGameById('counting')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[aria-label="По порядку"]')).not.toBeNull()
    expect(host.querySelector('.counting-game__meow')).toBeNull()
    expect(host.querySelector('[data-game-id="counting"]')).not.toBeNull()
    game!.unmount()
    expect(host.querySelector('[data-game-id="counting"]')).toBeNull()
  })
})
