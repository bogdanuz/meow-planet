import { pickOne, type Rng } from '../../shared/random'

export const SHAPE_DROP_PRAISES = [
  'Отлично!',
  'Здорово!',
  'Ура!',
  'Класс!',
] as const

export const SHAPE_COMPLETE_PRAISES = [
  'Супер! Фигурка готова!',
  'Здорово! Всё на месте!',
  'Класс! Можно собрать другую.',
] as const

export function pickShapeDropPraise(rng: Rng = Math.random): string {
  return pickOne(SHAPE_DROP_PRAISES, rng)!
}

export function pickShapeCompletePraise(rng: Rng = Math.random): string {
  return pickOne(SHAPE_COMPLETE_PRAISES, rng)!
}
