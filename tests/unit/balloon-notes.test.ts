import { describe, expect, it } from 'vitest'
import { balloonPopFrequency } from '../../src/shared/balloon-notes'
import { PLACEHOLDER_COLORS } from '../../src/shared/placeholders'

describe('balloon notes', () => {
  it('каждый цвет радуги имеет частоту', () => {
    for (const color of PLACEHOLDER_COLORS) {
      expect(balloonPopFrequency(color)).toBeGreaterThan(200)
      expect(balloonPopFrequency(color)).toBeLessThan(600)
    }
  })
})
