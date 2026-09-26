import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'
import type { HideSeekTaskVisual } from '../../shared/game-task-visual'
import { pickOne, shuffleCopy, type Rng } from '../../shared/random'

/** Мягкая подсказка после бездействия (не штрафной таймер). */
export const HIDE_SEEK_HINT_IDLE_MS = 6000

export const SCENE_IDS = [
  'room',
  'meadow',
  'beach',
  'forest',
  'playground',
] as const
export type SceneId = (typeof SCENE_IDS)[number]

export type HideTarget = {
  id: string
  labelRu: string
  shape: PlaceholderShape
  color: PlaceholderColor
  /** Позиция на сцене, % */
  xPct: number
  yPct: number
}

export type HideScene = {
  id: SceneId
  titleRu: string
  /** Универсальный «паттерн» локации (CSS до PNG S16). */
  pattern: 'warm-room' | 'meadow' | 'beach' | 'forest' | 'playground'
  targets: readonly HideTarget[]
}

export const HIDE_SCENE_TINT: Record<SceneId, string> = {
  room: '#f4c27a',
  meadow: '#8fce6b',
  beach: '#87ceeb',
  forest: '#5cbf7a',
  playground: '#ffb347',
}

export const HIDE_SCENES: readonly HideScene[] = [
  {
    id: 'room',
    titleRu: 'Комната',
    pattern: 'warm-room',
    targets: [
      { id: 'ball', labelRu: 'мячик', shape: 'circle', color: 'red', xPct: 22, yPct: 70 },
      { id: 'pillow', labelRu: 'подушку', shape: 'rect', color: 'blue', xPct: 72, yPct: 62 },
      { id: 'lamp', labelRu: 'лампу', shape: 'triangle', color: 'yellow', xPct: 50, yPct: 28 },
      { id: 'book', labelRu: 'книжку', shape: 'square', color: 'green', xPct: 38, yPct: 78 },
      { id: 'toy', labelRu: 'игрушку', shape: 'star', color: 'violet', xPct: 82, yPct: 38 },
    ],
  },
  {
    id: 'meadow',
    titleRu: 'Поляна',
    pattern: 'meadow',
    targets: [
      { id: 'flower', labelRu: 'цветок', shape: 'star', color: 'violet', xPct: 30, yPct: 65 },
      { id: 'butterfly', labelRu: 'бабочку', shape: 'triangle', color: 'orange', xPct: 68, yPct: 35 },
      { id: 'mushroom', labelRu: 'гриб', shape: 'circle', color: 'red', xPct: 55, yPct: 72 },
      { id: 'bee', labelRu: 'пчёлку', shape: 'circle', color: 'yellow', xPct: 18, yPct: 40 },
      { id: 'sun', labelRu: 'солнышко', shape: 'circle', color: 'orange', xPct: 78, yPct: 22 },
    ],
  },
  {
    id: 'beach',
    titleRu: 'Пляж',
    pattern: 'beach',
    targets: [
      { id: 'shell', labelRu: 'ракушку', shape: 'circle', color: 'orange', xPct: 25, yPct: 68 },
      { id: 'crab', labelRu: 'краба', shape: 'star', color: 'red', xPct: 70, yPct: 72 },
      { id: 'bucket', labelRu: 'ведро', shape: 'rect', color: 'blue', xPct: 48, yPct: 60 },
      { id: 'fish', labelRu: 'рыбку', shape: 'triangle', color: 'green', xPct: 80, yPct: 40 },
      { id: 'boat', labelRu: 'лодку', shape: 'rect', color: 'yellow', xPct: 35, yPct: 35 },
    ],
  },
  {
    id: 'forest',
    titleRu: 'Лес',
    pattern: 'forest',
    targets: [
      { id: 'berry', labelRu: 'ягодку', shape: 'circle', color: 'red', xPct: 28, yPct: 68 },
      { id: 'cone', labelRu: 'шишку', shape: 'triangle', color: 'orange', xPct: 62, yPct: 72 },
      { id: 'snail', labelRu: 'улитку', shape: 'circle', color: 'yellow', xPct: 44, yPct: 58 },
      { id: 'leaf', labelRu: 'листик', shape: 'triangle', color: 'green', xPct: 75, yPct: 38 },
      { id: 'nest', labelRu: 'гнездо', shape: 'rect', color: 'blue', xPct: 20, yPct: 32 },
    ],
  },
  {
    id: 'playground',
    titleRu: 'Площадка',
    pattern: 'playground',
    targets: [
      { id: 'swing', labelRu: 'качели', shape: 'rect', color: 'blue', xPct: 30, yPct: 42 },
      { id: 'slide', labelRu: 'горку', shape: 'triangle', color: 'green', xPct: 68, yPct: 48 },
      { id: 'ball-pg', labelRu: 'мячик', shape: 'circle', color: 'red', xPct: 52, yPct: 72 },
      { id: 'car-toy', labelRu: 'машинку', shape: 'square', color: 'orange', xPct: 18, yPct: 65 },
      { id: 'kite', labelRu: 'воздушного змея', shape: 'star', color: 'violet', xPct: 78, yPct: 28 },
    ],
  },
]

export function getScene(id: SceneId): HideScene {
  const scene = HIDE_SCENES.find((s) => s.id === id)
  if (!scene) throw new Error(`Unknown scene: ${id}`)
  return scene
}

export function findPrompt(target: HideTarget): string {
  return `Найди ${target.labelRu}!`
}

export function taskVisualForTarget(target: HideTarget): HideSeekTaskVisual {
  return {
    gameId: 'hide-seek',
    kind: 'target',
    shape: target.shape,
    color: target.color,
  }
}

export function pickTarget(
  scene: HideScene,
  excludeIds: readonly string[] = [],
  rng: Rng = Math.random,
): HideTarget {
  const pool = scene.targets.filter((t) => !excludeIds.includes(t.id))
  const list = pool.length > 0 ? pool : [...scene.targets]
  return pickOne(list, rng)!
}

export function evaluateTap(
  tappedId: string,
  wantedId: string,
): { found: boolean; softMiss: boolean } {
  if (tappedId === wantedId) return { found: true, softMiss: false }
  return { found: false, softMiss: true }
}

export function nextSceneId(current: SceneId): SceneId {
  const i = SCENE_IDS.indexOf(current)
  return SCENE_IDS[(i + 1) % SCENE_IDS.length]!
}

export function shuffledTargets(scene: HideScene, rng: Rng = Math.random): HideTarget[] {
  return shuffleCopy(scene.targets, rng)
}

/** Точки для случайной расстановки (паттерн-фон, не у края). */
export const HIDE_LAYOUT_SLOTS: readonly { xPct: number; yPct: number }[] = [
  { xPct: 18, yPct: 32 },
  { xPct: 42, yPct: 28 },
  { xPct: 68, yPct: 35 },
  { xPct: 82, yPct: 42 },
  { xPct: 25, yPct: 58 },
  { xPct: 52, yPct: 55 },
  { xPct: 75, yPct: 62 },
  { xPct: 35, yPct: 72 },
  { xPct: 62, yPct: 78 },
  { xPct: 48, yPct: 38 },
]

/** Новые места предметов на той же локации (id/shape/color те же). */
export function shuffleTargetPositions(
  targets: readonly HideTarget[],
  rng: Rng = Math.random,
): HideTarget[] {
  if (targets.length > HIDE_LAYOUT_SLOTS.length) {
    throw new Error('Not enough layout slots for hide-seek targets')
  }
  const slots = shuffleCopy([...HIDE_LAYOUT_SLOTS], rng).slice(0, targets.length)
  return targets.map((t, i) => ({
    ...t,
    xPct: slots[i]!.xPct,
    yPct: slots[i]!.yPct,
  }))
}
