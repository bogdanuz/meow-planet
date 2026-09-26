import { pickOne, type Rng } from '../../shared/random'
import type { CareAction } from './logic'

const CARE_PRAISE: Record<CareAction, readonly string[]> = {
  wash: ['Мяu сияет!', 'Чистенький!', 'Блестит!'],
  teeth: ['Зубки чистые!', 'Сверкает!', 'Молодец!'],
  dress: ['Мяu одет!', 'Красиво!', 'Готов!'],
  bath: ['Плюх-плюх!', 'Мяu мокрый и довольный!', 'Купание!'],
  feed: ['Мяu жуёт. Спасибо!', 'Вкусно!', 'Ням-ням!'],
  pet: ['Мяu мурлычет.', 'Мур-мур!', 'Нежно!'],
}

export const MEOW_TAP_PRAISES = ['Мяu!', 'Привет!', 'Мур!', 'Улыбка!'] as const

export const DAY_PROP_PRAISES = ['Смотри!', 'Интересно!', 'Мяu рад!'] as const

export const NIGHT_QUIET_HINTS = ['Тихая ночь…', 'Звёзды мерцают.', 'Тише…'] as const

export function pickCarePraise(action: CareAction, rng: Rng = Math.random): string {
  return pickOne(CARE_PRAISE[action], rng)!
}

export function pickMeowTapPraise(rng: Rng = Math.random): string {
  return pickOne(MEOW_TAP_PRAISES, rng)!
}

export function pickDayPropPraise(rng: Rng = Math.random): string {
  return pickOne(DAY_PROP_PRAISES, rng)!
}

export function pickNightQuietHint(rng: Rng = Math.random): string {
  return pickOne(NIGHT_QUIET_HINTS, rng)!
}

export function pickBlanketHint(rng: Rng = Math.random): string {
  return pickOne(['Укутали Мяu.', 'Тепло и уютно.', 'Сладких снов…'] as const, rng)!
}
