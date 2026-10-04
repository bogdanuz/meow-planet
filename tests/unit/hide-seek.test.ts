import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HIDE_SCENES, HIDE_SCENE_IDS, getHideScene, isHideSceneId } from '../../src/games/hide-seek/scenes'
import {
  HIDEOUT_MIN_GAP,
  LEVEL_TARGETS,
  buildRound,
  evaluateTap,
  nextTargetId,
  nextUnstarredScene,
  type HideLevel,
} from '../../src/games/hide-seek/logic'
import { placementGeometry } from '../../src/games/hide-seek/geometry'
import { ITEM_ASPECT } from '../../src/games/hide-seek/item-aspect'
import {
  HIDE_SEEK_VOICE_SCRIPT,
  IDLE_LINES,
  NEAR_LINES,
  NEXT_LINES,
  OTHER_LINES,
  PRAISE_LINES,
  ROUND_DONE_LINES,
  START_LINES,
  foundLine,
  introLine,
  whereLine,
} from '../../src/games/hide-seek/phrases'
import { HIDE_SEEK_VOICE_READY, hideVoiceUrl } from '../../src/games/hide-seek/art'
import { createSeededRandom } from '../../src/shared/random'

const LEVELS: readonly HideLevel[] = ['easy', 'medium', 'hard']

describe('hide-seek: сцены', () => {
  it('6 сцен S16 по викторине', () => {
    expect(HIDE_SCENE_IDS).toEqual(['room', 'kitchen', 'garden', 'beach', 'forest', 'playground'])
    expect(HIDE_SCENES.map((s) => s.titleRu)).toEqual(['Детская', 'Кухня', 'Сад', 'Пляж', 'Лес', 'Площадка'])
    expect(isHideSceneId('beach')).toBe(true)
    expect(isHideSceneId('meadow')).toBe(false)
  })

  it('на каждой сцене 10 предметов с картинкой и 11+ укрытий, из них 1–2 «ку-ку» и 5+ за предметами сцены', () => {
    for (const scene of HIDE_SCENES) {
      expect(scene.items).toHaveLength(10)
      expect(new Set(scene.items.map((i) => i.id)).size).toBe(10)
      for (const item of scene.items) expect(ITEM_ASPECT[`${scene.id}-${item.id}`]).toBeGreaterThan(0)
      expect(scene.hideouts.length).toBeGreaterThanOrEqual(11)
      const kuku = scene.hideouts.filter((h) => h.kuku).length
      expect(kuku).toBeGreaterThanOrEqual(1)
      expect(kuku).toBeLessThanOrEqual(2)
      expect(scene.hideouts.filter((h) => !h.kuku && !h.texture).length, scene.id).toBeGreaterThanOrEqual(5)
    }
  })

  it('укрытия в безопасной зоне: не под шапкой, ведущим и полоской (и в зеркале)', () => {
    for (const scene of HIDE_SCENES) {
      for (const h of scene.hideouts) {
        expect(h.x, `${scene.id} x`).toBeGreaterThanOrEqual(6)
        expect(h.x, `${scene.id} x`).toBeLessThanOrEqual(94)
        expect(h.y - h.s * 1.2, `${scene.id} верх предмета`).toBeGreaterThanOrEqual(15)
        expect(h.y, `${scene.id} край`).toBeLessThanOrEqual(78)
        const nearSide = h.x < 24 || h.x > 76
        if (nearSide) expect(h.y, `${scene.id} угол ведущего`).toBeLessThanOrEqual(70)
      }
    }
  })

  it('слова для фраз: именительный, винительный, род', () => {
    const forest = getHideScene('forest')
    const hedgehog = forest.items.find((i) => i.id === 'hedgehog')!
    expect(hedgehog).toMatchObject({ nom: 'ёжик', acc: 'ёжика', gender: 'm' })
    const garden = getHideScene('garden')
    const ladybug = garden.items.find((i) => i.id === 'ladybug')!
    expect(ladybug).toMatchObject({ nom: 'божья коровка', acc: 'божью коровку', gender: 'f' })
  })
})

describe('hide-seek: раунд', () => {
  it('сколько искать — по уровню: 3 / 4 / 5', () => {
    expect(LEVEL_TARGETS).toEqual({ easy: 3, medium: 4, hard: 5 })
    for (const scene of HIDE_SCENES) {
      for (const level of LEVELS) {
        for (let seed = 1; seed <= 25; seed += 1) {
          const round = buildRound(scene, level, createSeededRandom(seed))
          expect(round.targets).toHaveLength(LEVEL_TARGETS[level])
        }
      }
    }
  })

  it('разные предметы в разных укрытиях, укрытия не налезают друг на друга', () => {
    for (const scene of HIDE_SCENES) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const round = buildRound(scene, 'hard', createSeededRandom(seed))
        const all = [...round.targets, ...round.decoys]
        expect(new Set(all.map((p) => p.item.id)).size).toBe(all.length)
        expect(new Set(all.map((p) => p.hideout)).size).toBe(all.length)
        for (let i = 0; i < all.length; i += 1) {
          for (let j = i + 1; j < all.length; j += 1) {
            const a = all[i]!.hideout
            const b = all[j]!.hideout
            expect(Math.hypot(a.x - b.x, a.y - b.y), `${scene.id} seed ${seed}`).toBeGreaterThanOrEqual(HIDEOUT_MIN_GAP)
          }
        }
      }
    }
  })

  it('«Сложно»: ровно одна цель сидит в «ку-ку», обманки — не в «ку-ку»', () => {
    for (const scene of HIDE_SCENES) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const round = buildRound(scene, 'hard', createSeededRandom(seed))
        expect(round.targets.filter((p) => p.hideout.kuku)).toHaveLength(1)
        expect(round.decoys.every((p) => !p.hideout.kuku)).toBe(true)
      }
    }
  })

  it('«Легко» и «Средне»: ни «ку-ку», ни текстур (куст, сено, песок) — только за предметами сцены', () => {
    for (const scene of HIDE_SCENES) {
      for (const level of ['easy', 'medium'] as const) {
        for (let seed = 1; seed <= 25; seed += 1) {
          const round = buildRound(scene, level, createSeededRandom(seed))
          for (const p of round.targets) {
            expect(p.hideout.kuku, `${scene.id} ${level} ${seed}`).toBeUndefined()
            expect(p.hideout.texture, `${scene.id} ${level} ${seed}`).toBeUndefined()
          }
        }
      }
    }
  })

  it('видно: «Легко» целиком, «Средне» от половины до двух третей, «Сложно» треть', () => {
    for (const scene of HIDE_SCENES) {
      for (let seed = 1; seed <= 15; seed += 1) {
        for (const p of buildRound(scene, 'easy', createSeededRandom(seed)).targets) expect(p.cover).toBe(0)
        for (const p of buildRound(scene, 'medium', createSeededRandom(seed)).targets) {
          expect(p.cover).toBeGreaterThanOrEqual(1 / 3 - 1e-9)
          expect(p.cover).toBeLessThanOrEqual(1 / 2 + 1e-9)
        }
        for (const p of buildRound(scene, 'hard', createSeededRandom(seed)).targets) {
          if (p.hideout.kuku) expect(p.cover).toBe(1)
          else expect(p.cover).toBeCloseTo(2 / 3)
        }
      }
    }
  })

  it('предмет стоит там, где ему место по смыслу (список `fits` укрытия)', () => {
    for (const scene of HIDE_SCENES) {
      const ids = new Set(scene.items.map((i) => i.id))
      for (const h of scene.hideouts) for (const id of h.fits ?? []) expect(ids.has(id), `${scene.id}: ${id}`).toBe(true)
      for (const level of LEVELS) {
        for (let seed = 1; seed <= 25; seed += 1) {
          const round = buildRound(scene, level, createSeededRandom(seed))
          for (const p of [...round.targets, ...round.decoys]) {
            if (p.hideout.fits) expect(p.hideout.fits, `${scene.id} ${level} ${seed}`).toContain(p.item.id)
          }
        }
      }
    }
  })

  it('обманка только на «Сложно», по возможности того же цвета, что цель', () => {
    const scene = getHideScene('kitchen')
    expect(buildRound(scene, 'easy', createSeededRandom(4)).decoys).toHaveLength(0)
    expect(buildRound(scene, 'medium', createSeededRandom(4)).decoys).toHaveLength(0)
    let sameColor = 0
    for (let seed = 1; seed <= 30; seed += 1) {
      const round = buildRound(scene, 'hard', createSeededRandom(seed))
      expect(round.decoys).toHaveLength(1)
      const decoy = round.decoys[0]!
      expect(round.targets.map((t) => t.item.id)).not.toContain(decoy.item.id)
      if (round.targets.some((t) => t.item.color === decoy.item.color)) sameColor += 1
    }
    expect(sameColor).toBeGreaterThan(15)
  })

  it('случайно: набор, места и порядок меняются от раунда к раунду', () => {
    const scene = getHideScene('room')
    const a = buildRound(scene, 'medium', createSeededRandom(1))
    const b = buildRound(scene, 'medium', createSeededRandom(2))
    const key = (r: typeof a) => r.targets.map((t) => `${t.item.id}@${t.hideout.x},${t.hideout.y}`).join('|')
    expect(key(a)).not.toBe(key(b))
  })

  it('зеркало запоминается в раунде', () => {
    const scene = getHideScene('beach')
    expect(buildRound(scene, 'easy', createSeededRandom(3), true).mirrored).toBe(true)
    expect(buildRound(scene, 'easy', createSeededRandom(3)).mirrored).toBe(false)
  })

  it('тап: нужный — найден; другой из раунда — засчитан; остальное — мимо', () => {
    const round = buildRound(getHideScene('forest'), 'hard', createSeededRandom(7))
    const [first, second] = round.targets
    const found = new Set<string>()
    expect(evaluateTap(round, found, first!.item.id, first!.item.id)).toBe('found')
    expect(evaluateTap(round, found, first!.item.id, second!.item.id)).toBe('other')
    expect(evaluateTap(round, found, first!.item.id, round.decoys[0]!.item.id)).toBe('miss')
    expect(evaluateTap(round, found, first!.item.id, null)).toBe('miss')
    found.add(second!.item.id)
    expect(evaluateTap(round, found, first!.item.id, second!.item.id)).toBe('miss')
  })

  it('следующее задание — по порядку раунда, без найденных', () => {
    const round = buildRound(getHideScene('garden'), 'easy', createSeededRandom(5))
    const ids = round.targets.map((t) => t.item.id)
    expect(nextTargetId(round, new Set())).toBe(ids[0])
    expect(nextTargetId(round, new Set([ids[0]!]))).toBe(ids[1])
    expect(nextTargetId(round, new Set([ids[1]!]))).toBe(ids[0])
    expect(nextTargetId(round, new Set(ids))).toBeNull()
  })

  it('«Ещё» — следующая сцена без звёздочки', () => {
    expect(nextUnstarredScene('room', new Set())).toBe('kitchen')
    expect(nextUnstarredScene('room', new Set(['kitchen', 'garden']))).toBe('beach')
    expect(nextUnstarredScene('playground', new Set())).toBe('room')
    expect(nextUnstarredScene(null, new Set(['room']))).toBe('kitchen')
    expect(nextUnstarredScene('beach', new Set(HIDE_SCENE_IDS))).toBe('forest')
  })
})

describe('hide-seek: как прячется', () => {
  const bottom = { x: 50, y: 50, s: 10, side: 'bottom', edge: 'straight' } as const

  it('снизу: под край уходит доля предмета по уровню, кусок сцены накрывает её', () => {
    const g = placementGeometry(bottom, 1, 0.45, 1)
    expect(g.item.h).toBeCloseTo(10)
    expect(g.item.w).toBeCloseTo(7.5)
    expect(g.item.y + g.item.h).toBeCloseTo(54.5)
    expect(g.patch!.y).toBeCloseTo(50)
    expect(g.patch!.y + g.patch!.h).toBeGreaterThanOrEqual(g.item.y + g.item.h)
    expect(g.patch!.x).toBeLessThan(g.item.x)
    expect(g.patch!.x + g.patch!.w).toBeGreaterThan(g.item.x + g.item.w)
  })

  it('«Легко» (ничего не закрыто): предмет целиком над краем, заплатки нет', () => {
    const g = placementGeometry({ ...bottom, edge: 'soft' }, 1, 0, 1)
    expect(g.item.y + g.item.h).toBeCloseTo(50)
    expect(g.patch).toBeNull()
    const side = placementGeometry({ x: 40, y: 40, s: 10, side: 'left', edge: 'soft' }, 1, 0, 1)
    expect(side.item.x).toBeCloseTo(40)
    expect(side.patch).toBeNull()
  })

  it('мягкий край начинается чуть выше линии', () => {
    const g = placementGeometry({ ...bottom, edge: 'soft' }, 1, 0.45, 1)
    expect(g.patch!.y).toBeLessThan(50)
    expect(g.fade).toBeGreaterThan(0)
  })

  it('широкий предмет не раздувается: самая длинная сторона ограничена', () => {
    const g = placementGeometry(bottom, 1.5, 0.2, 1)
    expect(g.item.w / 0.75).toBeLessThanOrEqual(10 * 1.2 + 0.01)
  })

  it('«ку-ку»: предмет целиком под краем', () => {
    const g = placementGeometry({ ...bottom, kuku: true }, 1, 0.2, 1)
    expect(g.item.y).toBeGreaterThanOrEqual(50)
    expect(g.patch!.y + g.patch!.h).toBeGreaterThanOrEqual(g.item.y + g.item.h)
  })

  it('укрытие слева: предмет выглядывает вправо, кусок закрывает левую часть', () => {
    const g = placementGeometry({ x: 40, y: 40, s: 10, side: 'left', edge: 'straight' }, 1, 0.5, 1)
    expect(g.item.x).toBeLessThan(40)
    expect(g.item.x + g.item.w).toBeGreaterThan(40)
    expect(g.patch!.x + g.patch!.w).toBeCloseTo(40)
    expect(g.patch!.x).toBeLessThanOrEqual(g.item.x)
    expect(g.item.y + g.item.h / 2).toBeCloseTo(40)
  })

  it('укрытие справа: зеркально', () => {
    const g = placementGeometry({ x: 60, y: 40, s: 10, side: 'right', edge: 'straight' }, 1, 0.5, 1)
    expect(g.item.x).toBeLessThan(60)
    expect(g.item.x + g.item.w).toBeGreaterThan(60)
    expect(g.patch!.x).toBeCloseTo(60)
    expect(g.patch!.x + g.patch!.w).toBeGreaterThanOrEqual(g.item.x + g.item.w)
  })

  it('зона тапа шире предмета', () => {
    const g = placementGeometry(bottom, 1, 0.45, 1)
    expect(g.hit.w).toBeGreaterThan(g.item.w)
    expect(g.hit.h).toBeGreaterThan(g.item.h * 0.55)
  })
})

describe('hide-seek: фразы', () => {
  it('2 фразы с именем на предмет', () => {
    const forest = getHideScene('forest')
    const hedgehog = forest.items.find((i) => i.id === 'hedgehog')!
    const squirrel = forest.items.find((i) => i.id === 'squirrel')!
    const mushroom = forest.items.find((i) => i.id === 'mushroom')!
    expect(whereLine(hedgehog)).toEqual({ file: 'where-hedgehog.mp3', text: 'Где спрятался ёжик?' })
    expect(whereLine(mushroom).text).toBe('Где спрятался грибочек?')
    expect(foundLine(mushroom).text).toBe('Вот он, грибочек!')
    expect(foundLine(hedgehog).text).toBe('Вот он, ёжик!')
    expect(whereLine(squirrel).text).toBe('Где спряталась белка?')
    expect(foundLine(squirrel).text).toBe('Вот она, белка!')
    const kitchen = getHideScene('kitchen')
    const apple = kitchen.items.find((i) => i.id === 'apple')!
    expect(whereLine(apple).text).toBe('Где спряталось яблоко?')
    expect(foundLine(apple).text).toBe('Вот оно, яблоко!')
  })

  it('знакомство со сценой', () => {
    expect(introLine(getHideScene('kitchen')).text).toBe('Мы на кухне! Тут кто-то прячется…')
    expect(introLine(getHideScene('beach')).text).toBe('Мы на пляже! Давай поищем, кто спрятался!')
  })

  it('сценарий озвучки: ровно 150 фраз, без find-*, одинаковые предметы делят фразы', () => {
    const files = HIDE_SEEK_VOICE_SCRIPT.map((l) => l.file)
    expect(files).toHaveLength(150)
    expect(new Set(files).size).toBe(150)
    expect(files.filter((f) => f.startsWith('find-'))).toEqual([])
    expect(files.filter((f) => f.startsWith('where-snail'))).toHaveLength(1)
    expect(files[0]).toBe('intro-room.mp3')
    expect(files[6]).toBe('start-01.mp3')
    expect(files[9]).toBe('where-duck.mp3')
    expect(files[123]).toBe('near-01.mp3')
    expect(files[149]).toBe('done-06.mp3')
  })

  it('группы общих фраз: start 3, near 6, other 4, next 3, praise 5, idle 3, done 6', () => {
    expect(START_LINES).toHaveLength(3)
    expect(NEAR_LINES).toHaveLength(6)
    expect(OTHER_LINES).toHaveLength(4)
    expect(NEXT_LINES).toHaveLength(3)
    expect(PRAISE_LINES).toHaveLength(5)
    expect(IDLE_LINES).toHaveLength(3)
    expect(ROUND_DONE_LINES).toHaveLength(6)
  })

  it('голос включён, только если на месте ровно 150 mp3 из списка (без find-*)', () => {
    const dir = path.resolve(__dirname, '../../public/assets/games/hide-seek/voice')
    const onDisk = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mp3')).sort() : []
    const expected = HIDE_SEEK_VOICE_SCRIPT.map((l) => l.file).sort()
    if (HIDE_SEEK_VOICE_READY) expect(onDisk).toEqual(expected)
    expect(onDisk.filter((f) => f.startsWith('find-'))).toEqual([])
    expect(hideVoiceUrl('where-duck.mp3', true)).toMatch(/assets\/games\/hide-seek\/voice\/where-duck\.mp3$/)
  })

  it('hide-seek-VOICE-SCRIPT.md совпадает с кодом строка в строку', () => {
    const md = readFileSync(path.resolve(__dirname, '../../docs/assets/hide-seek-VOICE-SCRIPT.md'), 'utf8')
    const rows = [...md.matchAll(/^\|\s*`([a-z0-9-]+\.mp3)`\s*\|\s*(.+?)\s*\|\s*$/gm)].map((m) => ({
      file: m[1]!,
      text: m[2]!,
    }))
    expect(rows).toEqual(HIDE_SEEK_VOICE_SCRIPT.map(({ file, text }) => ({ file, text })))
  })
})
