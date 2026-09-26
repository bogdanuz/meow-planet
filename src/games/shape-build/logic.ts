import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'
import {
  distancePx,
  resolveMagnetDrop,
  type MagnetDropResult,
  type Point,
} from '../../shared/placement'

/** Фигуры MVP — без rotate/scale. */
export const SHAPE_KINDS = [
  'circle',
  'square',
  'triangle',
  'rect',
  'star',
] as const

export type ShapeKind = (typeof SHAPE_KINDS)[number]

export const TEMPLATE_IDS = [
  'house',
  'car',
  'fish',
  'meow',
  'rocket',
  'sun',
  'flower',
  'boat',
  'apple',
  'star-bunny',
] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export type SlotSpec = {
  id: string
  shape: ShapeKind
  /** Центр слота, % от ширины/высоты доски */
  xPct: number
  yPct: number
  color: PlaceholderColor
}

export type TemplateSpec = {
  id: TemplateId
  titleRu: string
  slots: readonly SlotSpec[]
}

/** Fallback для center-distance (tap); drag — rect magnet в slot-magnet.ts */
export const MAGNET_RADIUS_PX = 88

export const TEMPLATES: readonly TemplateSpec[] = [
  {
    id: 'house',
    titleRu: 'Дом',
    slots: [
      { id: 'house-roof', shape: 'triangle', xPct: 50, yPct: 28, color: 'red' },
      { id: 'house-body', shape: 'square', xPct: 50, yPct: 58, color: 'yellow' },
      { id: 'house-door', shape: 'rect', xPct: 50, yPct: 72, color: 'orange' },
    ],
  },
  {
    id: 'car',
    titleRu: 'Машина',
    slots: [
      { id: 'car-cabin', shape: 'square', xPct: 42, yPct: 38, color: 'blue' },
      { id: 'car-body', shape: 'rect', xPct: 50, yPct: 55, color: 'green' },
      { id: 'car-wheel-l', shape: 'circle', xPct: 32, yPct: 72, color: 'indigo' },
      { id: 'car-wheel-r', shape: 'circle', xPct: 68, yPct: 72, color: 'indigo' },
    ],
  },
  {
    id: 'fish',
    titleRu: 'Рыбка',
    slots: [
      { id: 'fish-body', shape: 'circle', xPct: 42, yPct: 50, color: 'blue' },
      { id: 'fish-tail', shape: 'triangle', xPct: 72, yPct: 50, color: 'orange' },
      { id: 'fish-eye', shape: 'circle', xPct: 30, yPct: 42, color: 'yellow' },
    ],
  },
  {
    id: 'meow',
    titleRu: 'Мяу',
    slots: [
      { id: 'meow-ear-l', shape: 'triangle', xPct: 36, yPct: 22, color: 'orange' },
      { id: 'meow-ear-r', shape: 'triangle', xPct: 64, yPct: 22, color: 'orange' },
      { id: 'meow-head', shape: 'circle', xPct: 50, yPct: 40, color: 'yellow' },
      { id: 'meow-body', shape: 'rect', xPct: 50, yPct: 68, color: 'orange' },
    ],
  },
  {
    id: 'rocket',
    titleRu: 'Ракета',
    slots: [
      { id: 'rocket-tip', shape: 'triangle', xPct: 50, yPct: 20, color: 'red' },
      { id: 'rocket-body', shape: 'rect', xPct: 50, yPct: 48, color: 'blue' },
      { id: 'rocket-window', shape: 'circle', xPct: 50, yPct: 45, color: 'yellow' },
      { id: 'rocket-fin', shape: 'star', xPct: 50, yPct: 78, color: 'violet' },
    ],
  },
  {
    id: 'sun',
    titleRu: 'Солнце',
    slots: [
      { id: 'sun-rays', shape: 'star', xPct: 50, yPct: 30, color: 'orange' },
      { id: 'sun-core', shape: 'circle', xPct: 50, yPct: 52, color: 'yellow' },
    ],
  },
  {
    id: 'flower',
    titleRu: 'Цветок',
    slots: [
      { id: 'flower-petals', shape: 'star', xPct: 50, yPct: 34, color: 'violet' },
      { id: 'flower-center', shape: 'circle', xPct: 50, yPct: 48, color: 'yellow' },
      { id: 'flower-stem', shape: 'rect', xPct: 50, yPct: 72, color: 'green' },
    ],
  },
  {
    id: 'boat',
    titleRu: 'Лодка',
    slots: [
      { id: 'boat-flag', shape: 'triangle', xPct: 58, yPct: 26, color: 'red' },
      { id: 'boat-sail', shape: 'triangle', xPct: 44, yPct: 38, color: 'orange' },
      { id: 'boat-hull', shape: 'rect', xPct: 50, yPct: 62, color: 'blue' },
    ],
  },
  {
    id: 'apple',
    titleRu: 'Яблочко',
    slots: [
      { id: 'apple-stem', shape: 'rect', xPct: 50, yPct: 22, color: 'orange' },
      { id: 'apple-leaf', shape: 'triangle', xPct: 54, yPct: 30, color: 'green' },
      { id: 'apple-body', shape: 'circle', xPct: 50, yPct: 55, color: 'red' },
    ],
  },
  {
    id: 'star-bunny',
    titleRu: 'Звёздный зайчик',
    slots: [
      { id: 'bunny-star', shape: 'star', xPct: 50, yPct: 22, color: 'violet' },
      { id: 'bunny-head', shape: 'circle', xPct: 42, yPct: 42, color: 'yellow' },
      { id: 'bunny-body', shape: 'circle', xPct: 58, yPct: 66, color: 'orange' },
    ],
  },
]

/** Фон превью в picker (до PNG S16). */
export const TEMPLATE_PICKER_TINT: Record<TemplateId, string> = {
  house: '#f4c27a',
  car: '#8ecae6',
  fish: '#5aa6e0',
  meow: '#ffb347',
  rocket: '#c5b9ff',
  sun: '#ffe08a',
  flower: '#f4a8d8',
  boat: '#89c2d9',
  apple: '#e85d5d',
  'star-bunny': '#ffd6a5',
}

export function getTemplate(id: TemplateId): TemplateSpec {
  const found = TEMPLATES.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown template: ${id}`)
  return found
}

export function softHintForShape(shape: ShapeKind): string {
  const labels: Record<ShapeKind, string> = {
    circle: 'кружок',
    square: 'квадрат',
    triangle: 'треугольник',
    rect: 'прямоугольник',
    star: 'звёздочку',
  }
  return `Найди место для этой фигуры — ${labels[shape]}.`
}

export function slotCenterOnBoard(
  slot: SlotSpec,
  board: DOMRect,
): Point {
  return {
    x: board.left + (slot.xPct / 100) * board.width,
    y: board.top + (slot.yPct / 100) * board.height,
  }
}

export function evaluatePieceNearSlot(
  pieceShape: ShapeKind,
  slot: SlotSpec,
  pieceCenter: Point,
  slotCenter: Point,
  magnetRadiusPx: number = MAGNET_RADIUS_PX,
): MagnetDropResult {
  const dist = distancePx(pieceCenter, slotCenter)
  return resolveMagnetDrop(
    pieceShape,
    slot.shape,
    dist,
    magnetRadiusPx,
    softHintForShape(pieceShape),
  )
}

/** Все слоты шаблона используют только разрешённые фигуры. */
export function assertTemplateShapes(template: TemplateSpec): boolean {
  return template.slots.every((s) =>
    (SHAPE_KINDS as readonly string[]).includes(s.shape),
  )
}

export function asPlaceholderShape(shape: ShapeKind): PlaceholderShape {
  return shape
}
