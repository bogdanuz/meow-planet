import { describe, expect, it } from 'vitest'
import {
  GAME_IDS,
  GAMES,
  MVP_ZONE_GAMES,
  ZONE_IDS,
  ZONES,
  type GameId,
  type ZoneId,
} from '../../src/content/catalog'
import { listGamesByZone } from '../../src/games/registry'

describe('MVP catalog', () => {
  it('ровно 5 зон и 9 игр с уникальными ID', () => {
    expect(ZONES).toHaveLength(5)
    expect(ZONE_IDS).toHaveLength(5)
    expect(new Set(ZONE_IDS).size).toBe(5)

    expect(GAMES).toHaveLength(9)
    expect(GAME_IDS).toHaveLength(9)
    expect(new Set(GAME_IDS).size).toBe(9)
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(9)
  })

  it('у каждой игры есть зона из ZONE_IDS', () => {
    for (const game of GAMES) {
      expect(ZONE_IDS).toContain(game.zoneId)
      expect(game.title.length).toBeGreaterThan(0)
    }
  })

  it('совпадает с таблицей зон/игр из docs/11', () => {
    for (const zoneId of ZONE_IDS) {
      const expected = [...MVP_ZONE_GAMES[zoneId]].sort()
      const fromCatalog = GAMES.filter((g) => g.zoneId === zoneId)
        .map((g) => g.id)
        .sort()
      const fromRegistry = listGamesByZone(zoneId)
        .map((g) => g.meta.id)
        .sort()

      expect(fromCatalog).toEqual(expected)
      expect(fromRegistry).toEqual(expected)
    }

    const allMvpIds = (Object.values(MVP_ZONE_GAMES) as GameId[][]).flat().sort()
    expect(allMvpIds).toEqual([...GAME_IDS].sort())
  })

  it('названия исторических зон сохранены в каталоге', () => {
    const titles: Record<ZoneId, string> = {
      'meow-orbit': 'Домик Мяу на орбите',
      'rainbow-meadow': 'Радужная поляна',
      'sound-grove': 'Звуковая роща',
      'planet-corners': 'Уголки планеты',
      'star-workshop': 'Мастерская звёзд',
    }
    for (const zone of ZONES) {
      expect(zone.title).toBe(titles[zone.id])
    }
  })

  it('все 9 игр есть в плоском каталоге для меню', () => {
    expect(GAMES.map((g) => g.id).sort()).toEqual([...GAME_IDS].sort())
  })
})
