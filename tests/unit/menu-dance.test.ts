import { describe, expect, it } from 'vitest'
import {
  MEOW_DANCE_STEP_MS,
  OLLI_DANCE_FRAMES,
  OLLI_DANCE_STEP_MS,
  OLLI_IDLE_FRAME,
} from '../../src/app/menu-cards'

describe('танец совы в меню', () => {
  it('шаг такой же спокойный, как у Мяу', () => {
    expect(OLLI_DANCE_STEP_MS).toBe(MEOW_DANCE_STEP_MS)
    expect(OLLI_DANCE_STEP_MS).toBeGreaterThanOrEqual(420)
  })

  it('покой — прямая сова, кадр улыбки не в танце', () => {
    expect(OLLI_IDLE_FRAME).toBe(1)
    expect(OLLI_DANCE_FRAMES).not.toContain(4)
    expect(OLLI_DANCE_FRAMES).toEqual([1, 2, 3, 2, 1, 5, 6, 5, 1])
  })
})
