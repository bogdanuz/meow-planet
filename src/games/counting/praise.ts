import { pickOne, type Rng } from '../../shared/random'

export const COUNT_STEP_PRAISES = ['Молодец!', 'Ура!', 'Дальше!', 'Здорово!'] as const

export const COUNT_COMPLETE_PRAISES = [
  'Ура, сосчитали!',
  'Класс, всё по порядку!',
  'Супер счёт!',
] as const

export const COUNT_GIVE_PRAISES = [
  'Спасибо! Верное количество.',
  'Мяу доволен!',
  'Именно столько!',
] as const

export function pickCountStepPraise(rng: Rng = Math.random): string {
  return pickOne(COUNT_STEP_PRAISES, rng)!
}

export function pickCountCompletePraise(rng: Rng = Math.random): string {
  return pickOne(COUNT_COMPLETE_PRAISES, rng)!
}

export function pickCountGivePraise(rng: Rng = Math.random): string {
  return pickOne(COUNT_GIVE_PRAISES, rng)!
}
