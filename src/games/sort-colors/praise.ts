import { pickOne, type Rng } from '../../shared/random'

/** На основе balloon-pop, без «шарик» — для сортировки игрушек. */
export const SORT_DROP_PRAISES = [
  'Отлично!',
  'Здорово!',
  'Ура!',
  'Класс!',
] as const

export const SORT_ROUND_PRAISES = [
  'Супер! Все игрушки на месте!',
  'Здорово! Все игрушки на месте!',
  'Класс! Все игрушки на месте!',
] as const

export function pickSortDropPraise(rng: Rng = Math.random): string {
  return pickOne(SORT_DROP_PRAISES, rng)!
}

export function pickSortRoundPraise(rng: Rng = Math.random): string {
  return pickOne(SORT_ROUND_PRAISES, rng)!
}
