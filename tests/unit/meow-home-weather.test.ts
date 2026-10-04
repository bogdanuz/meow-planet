import { describe, expect, it } from 'vitest'
import {
  feelsLike,
  hasRainbow,
  isNightHour,
  outfitReaction,
  precipKind,
  putOn,
  seasonForDate,
  takeOff,
  type Outfit,
  type Weather,
} from '../../src/games/meow-home/weather'

const calm = (over: Partial<Weather> = {}): Weather => ({ season: 'summer', sky: 'sun', precip: false, wind: false, night: false, ...over })
const wear = (...items: Outfit[number][]): Outfit => items

describe('«В гости»: время и сезон', () => {
  it('ночь по часам: с 20:00 до 7:00', () => {
    expect(isNightHour(19)).toBe(false)
    expect(isNightHour(20)).toBe(true)
    expect(isNightHour(3)).toBe(true)
    expect(isNightHour(7)).toBe(false)
  })

  it('сезон по дате: октябрь — осень, январь — зима, май — весна, июль — лето', () => {
    expect(seasonForDate(new Date(2026, 9, 3))).toBe('autumn')
    expect(seasonForDate(new Date(2026, 0, 10))).toBe('winter')
    expect(seasonForDate(new Date(2026, 11, 1))).toBe('winter')
    expect(seasonForDate(new Date(2026, 4, 31))).toBe('spring')
    expect(seasonForDate(new Date(2026, 6, 1))).toBe('summer')
  })
})

describe('«В гости»: погода слоями', () => {
  it('осадки: зимой снег, в остальные сезоны дождь', () => {
    expect(precipKind('winter')).toBe('snow')
    expect(precipKind('autumn')).toBe('rain')
  })

  it('радуга только при солнце и дожде, не зимой и не ночью', () => {
    expect(hasRainbow(calm({ precip: true }))).toBe(true)
    expect(hasRainbow(calm({ precip: true, sky: 'clouds' }))).toBe(false)
    expect(hasRainbow(calm({ precip: false }))).toBe(false)
    expect(hasRainbow(calm({ precip: true, season: 'winter' }))).toBe(false)
    expect(hasRainbow(calm({ precip: true, night: true }))).toBe(false)
  })

  it('ощущение тепла: зима холодно, осень прохладно (в ветер холодно), весна тепло, лето с солнцем жарко', () => {
    expect(feelsLike(calm({ season: 'winter' }))).toBe('cold')
    expect(feelsLike(calm({ season: 'autumn' }))).toBe('cool')
    expect(feelsLike(calm({ season: 'autumn', wind: true }))).toBe('cold')
    expect(feelsLike(calm({ season: 'spring' }))).toBe('warm')
    expect(feelsLike(calm({ season: 'summer' }))).toBe('hot')
    expect(feelsLike(calm({ season: 'summer', sky: 'clouds' }))).toBe('warm')
    expect(feelsLike(calm({ season: 'summer', night: true }))).toBe('warm')
  })
})

describe('«В гости»: одевание', () => {
  it('вещь одного места заменяет другую: куртка ↔ дождевик, сапоги ↔ валенки, шапка ↔ панамка', () => {
    expect(putOn(wear('coat', 'hat'), 'raincoat')).toEqual(['hat', 'raincoat'])
    expect(putOn(wear('boots'), 'valenki')).toEqual(['valenki'])
    expect(putOn(wear('panama', 'glasses'), 'hat')).toEqual(['glasses', 'hat'])
    expect(putOn(wear('scarf'), 'scarf')).toEqual(['scarf'])
  })

  it('снять вещь', () => {
    expect(takeOff(wear('coat', 'hat'), 'coat')).toEqual(['hat'])
    expect(takeOff(wear('hat'), 'coat')).toEqual(['hat'])
  })
})

describe('«В гости»: реакция на одежду', () => {
  it('зима без вещей — холодно, просит первую недостающую: шапку, потом куртку, потом валенки', () => {
    const winter = calm({ season: 'winter' })
    expect(outfitReaction(winter, wear())).toEqual({ mood: 'cold', want: 'hat' })
    expect(outfitReaction(winter, wear('hat'))).toEqual({ mood: 'cold', want: 'coat' })
    expect(outfitReaction(winter, wear('hat', 'coat'))).toEqual({ mood: 'cold', want: 'valenki' })
    expect(outfitReaction(winter, wear('hat', 'coat', 'valenki'))).toEqual({ mood: 'ok', want: null })
  })

  it('зимой в резиновых сапогах лапки мёрзнут — просит валенки', () => {
    expect(outfitReaction(calm({ season: 'winter' }), wear('hat', 'coat', 'boots'))).toEqual({ mood: 'cold-feet', want: 'valenki' })
  })

  it('холодный ветер без шарфа — ёжится и просит шарфик', () => {
    expect(outfitReaction(calm({ season: 'winter', wind: true }), wear('hat', 'coat', 'valenki'))).toEqual({ mood: 'windy', want: 'scarf' })
    expect(outfitReaction(calm({ season: 'autumn', wind: true }), wear('coat', 'hat'))).toEqual({ mood: 'windy', want: 'scarf' })
  })

  it('осенью прохладно: нужна куртка или дождевик', () => {
    const autumn = calm({ season: 'autumn' })
    expect(outfitReaction(autumn, wear())).toEqual({ mood: 'cold', want: 'coat' })
    expect(outfitReaction(autumn, wear('raincoat'))).toEqual({ mood: 'ok', want: null })
  })

  it('дождь без зонта и дождевика — мокнет, просит зонтик (это важнее холода)', () => {
    expect(outfitReaction(calm({ season: 'autumn', precip: true }), wear())).toEqual({ mood: 'wet', want: 'umbrella' })
    expect(outfitReaction(calm({ season: 'spring', precip: true }), wear('umbrella'))).toEqual({ mood: 'ok', want: null })
    expect(outfitReaction(calm({ season: 'spring', precip: true }), wear('raincoat'))).toEqual({ mood: 'ok', want: null })
  })

  it('снег — не дождь: зонт не нужен', () => {
    expect(outfitReaction(calm({ season: 'winter', precip: true }), wear('hat', 'coat', 'valenki'))).toEqual({ mood: 'ok', want: null })
  })

  it('жарко в тёплой вещи — просит снять её; без панамки на солнце — хочет панамку', () => {
    const summer = calm()
    expect(outfitReaction(summer, wear('coat'))).toEqual({ mood: 'hot', want: null, remove: 'coat' })
    expect(outfitReaction(summer, wear('hat', 'scarf'))).toEqual({ mood: 'hot', want: null, remove: 'hat' })
    expect(outfitReaction(summer, wear())).toEqual({ mood: 'hot', want: 'panama' })
    expect(outfitReaction(summer, wear('panama'))).toEqual({ mood: 'ok', want: null })
  })

  it('весной тепло: куртка лишняя, без неё — хорошо', () => {
    expect(outfitReaction(calm({ season: 'spring' }), wear('coat'))).toEqual({ mood: 'hot', want: null, remove: 'coat' })
    expect(outfitReaction(calm({ season: 'spring' }), wear())).toEqual({ mood: 'ok', want: null })
  })

  it('ночью летом панамка не нужна', () => {
    expect(outfitReaction(calm({ night: true }), wear())).toEqual({ mood: 'ok', want: null })
  })
})
