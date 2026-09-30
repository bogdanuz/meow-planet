import { describe, expect, it } from 'vitest'
import {
  comfortHintAfterSeasonChange,
  displayOutfit,
  sunWeatherAfterRain,
  weatherPickerOptions,
} from '../../src/games/meow-home/seasons-logic'

describe('seasons P15-09', () => {
  it('радуга не в пикере — только через солнце после дождя', () => {
    for (const season of ['spring', 'summer'] as const) {
      expect(weatherPickerOptions(season)).not.toContain('rainbow')
    }
    expect(sunWeatherAfterRain('spring', true)).toBe('rainbow')
    expect(sunWeatherAfterRain('spring', false)).toBe('sun')
    expect(sunWeatherAfterRain('winter', true)).toBe('sun')
  })

  it('куртка не включается автоматически от сезона', () => {
    expect(displayOutfit('winter', 'sun', false)).toBe('none')
    expect(displayOutfit('winter', 'sun', true)).toBe('coat')
    expect(displayOutfit('summer', 'sun', false)).toBe('light')
  })

  it('подсказка холодно/жарко при смене сезона', () => {
    expect(comfortHintAfterSeasonChange('winter', false)).toMatch(/холодно/i)
    expect(comfortHintAfterSeasonChange('summer', true)).toMatch(/жарко/i)
    expect(comfortHintAfterSeasonChange('summer', false)).toBeNull()
  })
})
