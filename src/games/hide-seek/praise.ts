import { pickOne, type Rng } from '../../shared/random'

export const HIDE_FOUND_PRAISES = [
  'Да!',
  'Ура!',
  'Нашли!',
  'Здорово!',
] as const

export const HIDE_ROUND_PRAISES = [
  'Супер! Всё нашли на этой картинке!',
  'Класс! Можно искать на другой локации.',
] as const

export function pickHideFoundPraise(rng: Rng = Math.random): string {
  return pickOne(HIDE_FOUND_PRAISES, rng)!
}

export function pickHideRoundPraise(rng: Rng = Math.random): string {
  return pickOne(HIDE_ROUND_PRAISES, rng)!
}
