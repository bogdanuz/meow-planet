/** «В гости» — улица: сезон, погода слоями, тепло и одежда (бриф S16, туры 5–7). */

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const
export type Season = (typeof SEASONS)[number]

export type Sky = 'sun' | 'clouds'

/** Погода из слоёв: небо + осадки + ветер. Ночь повторяет дом. */
export type Weather = {
  readonly season: Season
  readonly sky: Sky
  readonly precip: boolean
  readonly wind: boolean
  readonly night: boolean
}

export const WEAR_ITEMS = ['hat', 'panama', 'glasses', 'scarf', 'mittens', 'coat', 'raincoat', 'boots', 'valenki', 'umbrella'] as const
export type WearItem = (typeof WEAR_ITEMS)[number]
export type Outfit = readonly WearItem[]

/** Порядок слоёв на персонаже снизу вверх. Зонтик — отдельно, в лапке. */
export const LAYER_ORDER: readonly WearItem[] = ['boots', 'valenki', 'coat', 'raincoat', 'mittens', 'scarf', 'hat', 'panama', 'glasses']

const SLOT: Record<WearItem, string> = {
  hat: 'head',
  panama: 'head',
  glasses: 'eyes',
  scarf: 'neck',
  mittens: 'paws',
  coat: 'body',
  raincoat: 'body',
  boots: 'feet',
  valenki: 'feet',
  umbrella: 'hand',
}

const WARM_ITEMS: readonly WearItem[] = ['coat', 'hat', 'valenki', 'scarf', 'mittens']

export function isNightHour(hour: number): boolean {
  const h = ((hour % 24) + 24) % 24
  return h >= 20 || h < 7
}

export function seasonForDate(date: Date): Season {
  const m = date.getMonth()
  if (m === 11 || m <= 1) return 'winter'
  if (m <= 4) return 'spring'
  if (m <= 7) return 'summer'
  return 'autumn'
}

export function precipKind(season: Season): 'snow' | 'rain' {
  return season === 'winter' ? 'snow' : 'rain'
}

export const isRaining = (w: Weather): boolean => w.precip && w.season !== 'winter'

export function hasRainbow(w: Weather): boolean {
  return isRaining(w) && w.sky === 'sun' && !w.night
}

export type FeelsLike = 'cold' | 'cool' | 'warm' | 'hot'

export function feelsLike(w: Weather): FeelsLike {
  if (w.season === 'winter') return 'cold'
  if (w.season === 'autumn') return w.wind ? 'cold' : 'cool'
  if (w.season === 'spring') return 'warm'
  return w.sky === 'sun' && !w.night ? 'hot' : 'warm'
}

export function putOn(outfit: Outfit, item: WearItem): WearItem[] {
  return [...outfit.filter((i) => SLOT[i] !== SLOT[item]), item]
}

export function takeOff(outfit: Outfit, item: WearItem): WearItem[] {
  return outfit.filter((i) => i !== item)
}

export type Mood = 'ok' | 'cold' | 'cold-feet' | 'windy' | 'wet' | 'hot'
export type Reaction = { mood: Mood; want: WearItem | null; remove?: WearItem }

/** Что персонаж чувствует в этой одежде и какую вещь просит (первая недостающая). */
export function outfitReaction(w: Weather, outfit: Outfit): Reaction {
  const has = (i: WearItem): boolean => outfit.includes(i)
  if (isRaining(w) && !has('umbrella') && !has('raincoat')) return { mood: 'wet', want: 'umbrella' }
  const feel = feelsLike(w)
  if (feel === 'cold') {
    if (!has('hat')) return { mood: 'cold', want: 'hat' }
    if (w.season === 'winter') {
      if (!has('coat')) return { mood: 'cold', want: 'coat' }
      if (has('boots')) return { mood: 'cold-feet', want: 'valenki' }
      if (!has('valenki')) return { mood: 'cold', want: 'valenki' }
    } else if (!has('coat') && !has('raincoat')) {
      return { mood: 'cold', want: 'coat' }
    }
    if (w.wind && !has('scarf')) return { mood: 'windy', want: 'scarf' }
    return { mood: 'ok', want: null }
  }
  if (feel === 'cool') {
    if (!has('coat') && !has('raincoat')) return { mood: 'cold', want: 'coat' }
    return { mood: 'ok', want: null }
  }
  const warmOne = WARM_ITEMS.find(has)
  if (warmOne) return { mood: 'hot', want: null, remove: warmOne }
  if (feel === 'hot' && !has('panama')) return { mood: 'hot', want: 'panama' }
  return { mood: 'ok', want: null }
}
