/** Времена года — сезон × совместимая погода */

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const
export type Season = (typeof SEASONS)[number]

export const WEATHERS = [
  'sun',
  'rain',
  'snow',
  'wind',
  'rainbow',
  'clouds',
] as const
export type Weather = (typeof WEATHERS)[number]

export const SEASON_LABEL: Record<Season, string> = {
  winter: 'Зима',
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
}

export const SEASON_ICON: Record<Season, string> = {
  winter: '❄️',
  spring: '🌱',
  summer: '☀️',
  autumn: '🍂',
}

export const WEATHER_ICON: Record<Weather, string> = {
  sun: '☀️',
  rain: '🌧',
  snow: '❄️',
  wind: '💨',
  rainbow: '🌈',
  clouds: '☁️',
}

export const WEATHER_LABEL: Record<Weather, string> = {
  sun: 'Солнце',
  rain: 'Дождь',
  snow: 'Снег',
  wind: 'Ветер',
  rainbow: 'Радуга',
  clouds: 'Облака',
}

/** Какие погоды допустимы в сезоне */
export const WEATHER_BY_SEASON: Record<Season, readonly Weather[]> = {
  winter: ['sun', 'snow', 'wind', 'clouds'],
  spring: ['sun', 'rain', 'wind', 'rainbow', 'clouds'],
  summer: ['sun', 'rain', 'wind', 'rainbow', 'clouds'],
  autumn: ['sun', 'rain', 'wind', 'clouds'],
}

export type MeowOutfit = 'coat' | 'light' | 'rain' | 'none'

/** @deprecated S14 — используйте {@link displayOutfit} (P15: сезон не включает куртку сам). */
export function outfitFor(weather: Weather, season: Season): MeowOutfit {
  return displayOutfit(season, weather, season === 'winter')
}

/** Видимая одежда: куртку ребёнок включает тапом по Мяu (кроме снега / дождя). */
export function displayOutfit(
  season: Season,
  weather: Weather,
  coatOn: boolean,
): MeowOutfit {
  if (weather === 'rain') return 'rain'
  if (weather === 'snow' || coatOn) return 'coat'
  if (weather === 'sun' && season === 'summer') return 'light'
  return 'none'
}

export function weatherPickerOptions(season: Season): Weather[] {
  return WEATHER_BY_SEASON[season].filter((w) => w !== 'rainbow')
}

export function sunWeatherAfterRain(season: Season, hadRain: boolean): Weather {
  if (hadRain && isWeatherAllowed(season, 'rainbow')) return 'rainbow'
  return 'sun'
}

export function comfortHintAfterSeasonChange(
  season: Season,
  coatOn: boolean,
): string | null {
  if ((season === 'winter' || season === 'autumn') && !coatOn) {
    return 'Холодно. Тапни Мяу.'
  }
  if (season === 'summer' && coatOn) {
    return 'Жарко. Тапни Мяу.'
  }
  return null
}

export const RAINBOW_PARENT_HINT =
  'Радуга после дождя: можно коротко рассказать ребёнку, что солнце и дождь вместе дают радугу.'

export function flowerMood(weather: Weather): 'happy' | 'drink' | 'sleep' {
  if (weather === 'sun' || weather === 'rainbow') return 'happy'
  if (weather === 'rain') return 'drink'
  return 'sleep'
}

export function isWeatherAllowed(season: Season, weather: Weather): boolean {
  return WEATHER_BY_SEASON[season].includes(weather)
}

export function clampWeather(season: Season, weather: Weather): Weather {
  if (isWeatherAllowed(season, weather)) return weather
  return WEATHER_BY_SEASON[season][0]!
}
