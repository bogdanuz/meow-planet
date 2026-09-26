import { describe, expect, it, vi } from 'vitest'
import {
  evaluateTap,
  findPrompt,
  getScene,
  HIDE_SCENES,
  pickTarget,
  SCENE_IDS,
  shuffleTargetPositions,
} from '../../src/games/hide-seek/logic'
import { createSeededRandom } from '../../src/shared/random'

describe('hide-seek logic', () => {
  it('5 сцен MVP (S14)', () => {
    expect(SCENE_IDS).toEqual([
      'room',
      'meadow',
      'beach',
      'forest',
      'playground',
    ])
    expect(HIDE_SCENES).toHaveLength(5)
    expect(HIDE_SCENES.map((s) => s.titleRu)).toEqual([
      'Комната',
      'Поляна',
      'Пляж',
      'Лес',
      'Площадка',
    ])
  })

  it('на каждой сцене 5 целей с уникальными id', () => {
    for (const scene of HIDE_SCENES) {
      expect(scene.targets.length).toBe(5)
      expect(new Set(scene.targets.map((t) => t.id)).size).toBe(
        scene.targets.length,
      )
    }
  })

  it('pickTarget и evaluateTap', () => {
    const room = getScene('room')
    const target = pickTarget(room, [], createSeededRandom(3))
    expect(room.targets.map((t) => t.id)).toContain(target.id)
    expect(findPrompt(target)).toMatch(/^Найди /)

    expect(evaluateTap(target.id, target.id)).toEqual({
      found: true,
      softMiss: false,
    })
    expect(evaluateTap('other', target.id)).toEqual({
      found: false,
      softMiss: true,
    })
  })

  it('shuffleTargetPositions меняет координаты', () => {
    const room = getScene('room')
    const shuffled = shuffleTargetPositions(room.targets, createSeededRandom(9))
    expect(shuffled).toHaveLength(room.targets.length)
    const moved = shuffled.some((t, i) => {
      const orig = room.targets[i]!
      return t.xPct !== orig.xPct || t.yPct !== orig.yPct
    })
    expect(moved).toBe(true)
  })

  it('exclude уже найденные', () => {
    const room = getScene('room')
    const allButOne = room.targets.slice(0, -1).map((t) => t.id)
    const last = pickTarget(room, allButOne, () => 0)
    expect(allButOne).not.toContain(last.id)
    vi.useRealTimers()
  })
})
