import { pickOne, type Rng } from '../../shared/random'

export const PUZZLE_PIECE_PRAISES = [
  'Отлично!',
  'Здорово!',
  'Ура!',
  'Класс!',
] as const

export const PUZZLE_COMPLETE_PRAISES = [
  'Пазл собран! Можно выбрать другую картинку.',
  'Супер! Картинка готова!',
  'Здорово! Вся картинка на месте!',
] as const

export function pickPuzzlePiecePraise(rng: Rng = Math.random): string {
  return pickOne(PUZZLE_PIECE_PRAISES, rng)!
}

export function pickPuzzleCompletePraise(rng: Rng = Math.random): string {
  return pickOne(PUZZLE_COMPLETE_PRAISES, rng)!
}
