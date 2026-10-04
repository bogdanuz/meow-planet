import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  nextUnsolvedScene,
  PUZZLE_FRAME_MAGNET_PX,
  PUZZLE_SCENES,
  PUZZLE_SCENE_IDS,
} from '../../src/games/puzzle/logic'
import { PUZZLE_ART_READY } from '../../src/games/puzzle/art-ready'
import {
  pieceCellBackground,
  puzzleSceneUrl,
  puzzleThumbUrl,
} from '../../src/games/puzzle/scene-art'
import { loadSolvedScenes, markSceneSolved, PUZZLE_SOLVED_KEY } from '../../src/games/puzzle/progress'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
  }
}

describe('puzzle logic', () => {
  it('17 сцен: 14 из брифа S16 и 3 новые владельца, у каждой подпись и цвет', () => {
    expect(PUZZLE_SCENE_IDS).toEqual([
      'bake', 'picnic', 'bath', 'beach', 'snowman', 'garden', 'bedtime',
      'birthday', 'train', 'autumn', 'music', 'rain', 'farm', 'painting',
      'garage', 'dentist', 'newyear',
    ])
    expect(PUZZLE_SCENES.map((s) => s.titleRu).slice(-3)).toEqual(['Автосервис', 'Зубной врач', 'Новый год'])
    for (const scene of PUZZLE_SCENES) {
      expect(scene.titleRu.length).toBeGreaterThan(2)
      expect(scene.tint).toMatch(/^#[0-9a-f]{6}$/i)
    }
    expect(PUZZLE_FRAME_MAGNET_PX).toBeGreaterThanOrEqual(80)
  })

  it('«Ещё» — следующая несобранная по порядку, по кругу', () => {
    expect(nextUnsolvedScene('bake', new Set())).toBe('picnic')
    expect(nextUnsolvedScene('bake', new Set(['picnic', 'bath']))).toBe('beach')
    expect(nextUnsolvedScene('painting', new Set())).toBe('garage')
    expect(nextUnsolvedScene('newyear', new Set(['bake']))).toBe('picnic')
    expect(nextUnsolvedScene(null, new Set(['bake']))).toBe('picnic')
  })

  it('всё собрано — просто следующая по кругу', () => {
    const all = new Set<string>(PUZZLE_SCENE_IDS)
    expect(nextUnsolvedScene('bake', all)).toBe('picnic')
    expect(nextUnsolvedScene('newyear', all)).toBe('bake')
  })

  it('собранные картинки запоминаются, битая запись не роняет', () => {
    const storage = memoryStorage()
    expect(loadSolvedScenes(storage).size).toBe(0)
    markSceneSolved('rain', storage)
    markSceneSolved('bake', storage)
    expect([...loadSolvedScenes(storage)].sort()).toEqual(['bake', 'rain'])
    storage.setItem(PUZZLE_SOLVED_KEY, '{oops')
    expect(loadSolvedScenes(storage).size).toBe(0)
    storage.setItem(PUZZLE_SOLVED_KEY, JSON.stringify(['bake', 'nope', 3]))
    expect([...loadSolvedScenes(storage)]).toEqual(['bake'])
  })
})

describe('puzzle scene-art', () => {
  it('готовая сцена — webp из public, иначе цветная заглушка кодом', () => {
    for (const id of PUZZLE_SCENE_IDS) {
      const ready = PUZZLE_ART_READY.scenes.includes(id)
      const scene = puzzleSceneUrl(id)
      const thumb = puzzleThumbUrl(id)
      if (ready) {
        expect(scene).toMatch(new RegExp(`assets/games/puzzle/scenes/${id}\\.webp$`))
        expect(thumb).toMatch(new RegExp(`assets/games/puzzle/thumbs/${id}\\.webp$`))
      } else {
        expect(scene.startsWith('data:image/svg+xml')).toBe(true)
        expect(thumb).toBe(scene)
      }
    }
  })

  it('заглушки разные у разных сцен и без внешних ссылок', () => {
    const urls = PUZZLE_SCENE_IDS.map((id) => puzzleSceneUrl(id))
    expect(new Set(urls).size).toBe(urls.length)
    for (const url of urls) expect(url).not.toMatch(/https?:/)
  })

  it('кусочек — доля той же картинки по сетке', () => {
    const style = pieceCellBackground(5, 3, 2, 'pic.webp')
    expect(style).toContain('url("pic.webp")')
    expect(style).toContain('background-position:100% 100%')
    expect(style).toContain('background-size:300% 200%')
    expect(pieceCellBackground(0, 2, 2, 'pic.webp')).toContain('background-position:0% 0%')
  })

  it('скрипт assets:puzzle знает те же сцены в том же порядке', () => {
    const script = readFileSync(path.resolve(__dirname, '../../scripts/build-puzzle-assets.mjs'), 'utf8')
    const block = script.match(/const SCENES = \[([\s\S]*?)\]/)?.[1] ?? ''
    const ids = [...block.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
    expect(ids).toEqual([...PUZZLE_SCENE_IDS])
  })

  it('все картинки владельца подключены: заглушек не осталось', () => {
    expect([...PUZZLE_ART_READY.scenes]).toEqual([...PUZZLE_SCENE_IDS])
  })
})
