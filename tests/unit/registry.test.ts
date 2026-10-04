import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GAME_IDS, ZONE_IDS } from '../../src/content/catalog'
import {
  GAME_REGISTRY,
  getGameById,
  listAllGameIds,
  listGamesByZone,
} from '../../src/games/registry'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

describe('game registry', () => {
  const stored = new Map<string, string>()

  beforeEach(() => {
    stored.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
      clear: () => stored.clear(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('sort-colors mount/unmount рисует ящики и кучу игрушек', () => {
    const game = getGameById('sort-colors')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="sort-colors"]')).not.toBeNull()
    expect(host.querySelectorAll('.sort-colors__bin')).toHaveLength(4)
    expect(host.querySelectorAll('.sort-colors__pile .sort-colors__toy')).toHaveLength(12)
    game!.unmount()
    expect(host.querySelector('[data-game-id="sort-colors"]')).toBeNull()
  })

  it('shape-build mount/unmount: стартовая сцена, шкаф с 36 деталями по 4 вкладкам, шапка с «Отменить» и «Пуск!»; тап по кубику в шкафу — деталь в комнате', () => {
    localStorage.clear()
    const game = getGameById('shape-build')
    expect(game?.meta.title).toBe('Собери что угодно!')
    const host = document.createElement('div')
    document.body.append(host)
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    const root = host.querySelector<HTMLElement>('[data-game-id="shape-build"]')!
    expect(root).not.toBeNull()
    expect(root.dataset.cabinet).toBe('open')
    expect(root.dataset.pieces).toBe('5')
    expect(host.querySelectorAll('.shape-build__shelf-item')).toHaveLength(36)
    expect([...host.querySelectorAll<HTMLElement>('.shape-build__tab')].map((n) => n.dataset.tab)).toEqual([
      'parts',
      'items',
      'machines',
      'switches',
    ])
    expect(host.querySelectorAll('.shape-build__shelf-item:not([hidden])')).toHaveLength(11)
    expect(
      [...host.querySelectorAll('.shape-build__bar-tools > .game-tool .game-tool__label')].map((n) => n.textContent),
    ).toEqual(['Отменить', 'Пуск!', 'Бум!', 'Замри!', 'Гравитация', 'Фото', 'Заново', 'Ещё'])
    expect(host.querySelector('.shape-build__basket')).toBeNull()
    const cube = host.querySelector<HTMLButtonElement>('.shape-build__shelf-item[data-kind="cube"]')!
    cube.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 900, clientY: 200, pointerId: 1 }))
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 900, clientY: 200, pointerId: 1 }))
    expect(root.dataset.pieces).toBe('6')
    game!.unmount()
    expect(host.querySelector('[data-game-id="shape-build"]')).toBeNull()
    host.remove()
    localStorage.clear()
  })

  it('shape-build: постройка сохраняется при выходе и встречает при следующем входе', () => {
    localStorage.clear()
    const game = getGameById('shape-build')!
    const host = document.createElement('div')
    document.body.append(host)
    game.mount(host, { settings: DEFAULT_SETTINGS })
    const cube = host.querySelector<HTMLButtonElement>('.shape-build__shelf-item[data-kind="cube"]')!
    cube.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 900, clientY: 200, pointerId: 1 }))
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 900, clientY: 200, pointerId: 1 }))
    game.unmount()
    expect(localStorage.getItem('meow-planet.shape-build-room')).not.toBeNull()
    game.mount(host, { settings: DEFAULT_SETTINGS })
    const root = host.querySelector<HTMLElement>('[data-game-id="shape-build"]')!
    expect(root.dataset.pieces).toBe('6')
    game.unmount()
    host.remove()
    localStorage.clear()
  })

  it('shape-build: спрятанные взрослым детали не лежат в шкафу', () => {
    localStorage.clear()
    const game = getGameById('shape-build')!
    const host = document.createElement('div')
    game.mount(host, { settings: { ...DEFAULT_SETTINGS, sandboxHiddenKinds: ['stone', 'spring'] } })
    const kinds = [...host.querySelectorAll<HTMLElement>('.shape-build__shelf-item')].map((n) => n.dataset.kind)
    expect(kinds).not.toContain('stone')
    expect(kinds).not.toContain('spring')
    expect(kinds).toHaveLength(34)
    game.unmount()
    localStorage.clear()
  })

  it('hide-seek mount/unmount рисует галерею сцен', () => {
    const game = getGameById('hide-seek')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="hide-seek"]')).not.toBeNull()
    expect(host.querySelectorAll('.hide-seek__card')).toHaveLength(6)
    game!.unmount()
    expect(host.querySelector('[data-game-id="hide-seek"]')).toBeNull()
  })

  it('counting mount/unmount рисует ящик, коврик и цифры', () => {
    const game = getGameById('counting')
    expect(game).toBeDefined()
    const host = document.createElement('div')
    game!.mount(host, { settings: DEFAULT_SETTINGS })
    expect(host.querySelector('[data-game-id="counting"]')).not.toBeNull()
    expect(host.querySelectorAll('.counting__box')).toHaveLength(1)
    expect(host.querySelectorAll('.counting__digit')).toHaveLength(DEFAULT_SETTINGS.countingLimit)
    expect(host.querySelector('[aria-label="Свободно"]')).not.toBeNull()
    game!.unmount()
    expect(host.querySelector('[data-game-id="counting"]')).toBeNull()
  })
})
