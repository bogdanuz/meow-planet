import { pickOne, type Rng } from '../../shared/random'

export const SEASON_WEATHER_PRAISES = [
  'Красиво!',
  'Смотри, как меняется!',
  'Ура, погода!',
  'Здорово!',
] as const

export function pickSeasonWeatherPraise(rng: Rng = Math.random): string {
  return pickOne(SEASON_WEATHER_PRAISES, rng)!
}
