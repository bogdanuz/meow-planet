import { describe, expect, it } from 'vitest'
import {
  clampWeather,
  displayOutfit,
  isWeatherAllowed,
  WEATHER_BY_SEASON,
} from '../../src/games/seasons/logic'

describe('seasons matrix', () => {
  it('снег только зимой', () => {
    expect(isWeatherAllowed('winter', 'snow')).toBe(true)
    expect(isWeatherAllowed('summer', 'snow')).toBe(false)
    expect(clampWeather('summer', 'snow')).toBe(WEATHER_BY_SEASON.summer[0])
  })

  it('одежда Мяу: снег/дождь и ручная куртка', () => {
    expect(displayOutfit('winter', 'snow', false)).toBe('coat')
    expect(displayOutfit('spring', 'rain', false)).toBe('rain')
    expect(displayOutfit('summer', 'sun', false)).toBe('light')
    expect(displayOutfit('winter', 'sun', false)).toBe('none')
  })
})
