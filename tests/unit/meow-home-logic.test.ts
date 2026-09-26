import { describe, expect, it } from 'vitest'
import {
  CARE_ICON,
  PERIOD_ICON,
  periodFromHour,
} from '../../src/games/meow-home/logic'

describe('meow-home icons', () => {
  it('period icons cover all periods', () => {
    expect(PERIOD_ICON.morning).toBeTruthy()
    expect(PERIOD_ICON.night).toBeTruthy()
    expect(periodFromHour(8)).toBe('morning')
  })

  it('care icons for morning actions', () => {
    expect(CARE_ICON.feed).toBeTruthy()
    expect(CARE_ICON.wash).toBeTruthy()
  })
})
