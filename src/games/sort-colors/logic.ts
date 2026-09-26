import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'
import { FIELD_COLORS } from '../../shared/field-colors'
import { resolveMatchDrop } from '../../shared/placement'
import type { SoftCheckResult } from '../../shared/soft-error'
import { shuffleCopy, type Rng } from '../../shared/random'

/** 5 цветов как на поле «Лопни шарик» (без синего/indigo). */
export const SORT_COLORS = FIELD_COLORS

export type SortColor = (typeof SORT_COLORS)[number]

/** Простые формы для 2–3 лет (placeholder → PNG S16). */
export const SORT_TOY_SHAPES = [
  'circle',
  'square',
  'triangle',
  'heart',
  'star',
] as const satisfies readonly PlaceholderShape[]

export type SortToyShape = (typeof SORT_TOY_SHAPES)[number]

/** У каждой формы свой единственный цвет — не путаем ребёнка. */
export const BASKET_ICON_SHAPE: Record<SortColor, SortToyShape> = {
  red: 'circle',
  orange: 'square',
  yellow: 'triangle',
  green: 'heart',
  violet: 'star',
}

export const SHAPE_TO_COLOR: Record<SortToyShape, SortColor> = {
  circle: 'red',
  square: 'orange',
  triangle: 'yellow',
  heart: 'green',
  star: 'violet',
}

export type SortBead = {
  id: string
  color: SortColor
  shape: SortToyShape
  /** SORT-01…10 по манифесту */
  assetId: string
}

export type SortBasket = {
  id: string
  color: SortColor
  shape: SortToyShape
}

const COLOR_ADJ_M: Record<SortColor, string> = {
  red: 'красный',
  orange: 'оранжевый',
  yellow: 'жёлтый',
  green: 'зелёный',
  violet: 'фиолетовый',
}

const COLOR_ADJ_F: Record<SortColor, string> = {
  red: 'красная',
  orange: 'оранжевая',
  yellow: 'жёлтая',
  green: 'зелёная',
  violet: 'фиолетовая',
}

const COLOR_ADJ_N: Record<SortColor, string> = {
  red: 'красное',
  orange: 'оранжевое',
  yellow: 'жёлтое',
  green: 'зелёное',
  violet: 'фиолетовое',
}

/** Подписи корзинок и игрушек (викторина 24.09.2026: набор Б + сердечко). */
const SHAPE_NOUN_RU: Record<SortToyShape, string> = {
  circle: 'мячик',
  square: 'кубик',
  triangle: 'пирамидка',
  heart: 'сердечко',
  star: 'звёздочка',
}

const SHAPE_GENDER: Record<SortToyShape, 'm' | 'f' | 'n'> = {
  circle: 'm',
  square: 'm',
  triangle: 'f',
  heart: 'n',
  star: 'f',
}

function colorAdjForToy(color: SortColor, shape: SortToyShape): string {
  const g = SHAPE_GENDER[shape]
  if (g === 'f') return COLOR_ADJ_F[color]
  if (g === 'n') return COLOR_ADJ_N[color]
  return COLOR_ADJ_M[color]
}

export function sortShapeLabelRu(shape: SortToyShape): string {
  return SHAPE_NOUN_RU[shape]
}

export function sortToyLabelRu(color: SortColor, shape: SortToyShape): string {
  return `${colorAdjForToy(color, shape)} ${SHAPE_NOUN_RU[shape]}`
}

/** Подпись корзинки — название фигуры (не цвет). */
export function sortBasketLabelRu(shape: SortToyShape): string {
  const word = SHAPE_NOUN_RU[shape]
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function isCanonicalToy(color: SortColor, shape: SortToyShape): boolean {
  return BASKET_ICON_SHAPE[color] === shape && SHAPE_TO_COLOR[shape] === color
}

export function createBaskets(): SortBasket[] {
  return SORT_COLORS.map((color) => ({
    id: `basket-${color}`,
    color,
    shape: BASKET_ICON_SHAPE[color],
  }))
}

/** 10 игрушек: по 2 одинаковые (форма+цвет) на каждый тип. */
export function createBeads(rng: Rng = Math.random): SortBead[] {
  const beads: SortBead[] = []
  let n = 0
  for (const color of SORT_COLORS) {
    const shape = BASKET_ICON_SHAPE[color]
    for (let copy = 1; copy <= 2; copy += 1) {
      n += 1
      beads.push({
        id: `bead-${shape}-${copy}`,
        color,
        shape,
        assetId: `SORT-${String(n).padStart(2, '0')}`,
      })
    }
  }
  return shuffleCopy(beads, rng)
}

export function softHintForShape(shape: SortToyShape): string {
  return `Ищи корзинку с ${SHAPE_NOUN_RU[shape]}.`
}

/** Совпадение по форме (цвет связан 1:1 с формой). */
export function evaluateSortDrop(
  beadShape: SortToyShape,
  basketShape: SortToyShape,
): SoftCheckResult {
  return resolveMatchDrop(
    beadShape,
    basketShape,
    softHintForShape(beadShape),
  )
}

export function isSortColor(value: string): value is SortColor {
  return (SORT_COLORS as readonly string[]).includes(value)
}

export function isSortToyShape(value: string): value is SortToyShape {
  return (SORT_TOY_SHAPES as readonly string[]).includes(value)
}

export function asPlaceholderColor(color: SortColor): PlaceholderColor {
  return color
}
