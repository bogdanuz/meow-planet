import { describe, expect, it } from 'vitest'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../src/shared/soft-error-chain'

describe('soft-error-chain', () => {
  const msgs = {
    repeat: 'Ищем синий.',
    nudge: 'Синий — вот такой.',
    beforeHighlight: 'Смотри, синий подсвечен.',
  }

  it('эскалация 1 → 2 → подсветка', () => {
    const state = createSoftErrorChain()
    expect(advanceSoftErrorChain(state, msgs)).toEqual({
      message: msgs.repeat,
      shouldHighlight: false,
      wiggle: true,
    })
    expect(advanceSoftErrorChain(state, msgs)).toEqual({
      message: msgs.nudge,
      shouldHighlight: false,
      wiggle: true,
    })
    expect(advanceSoftErrorChain(state, msgs)).toEqual({
      message: msgs.beforeHighlight,
      shouldHighlight: true,
      wiggle: true,
    })
  })

  it('успех сбрасывает счётчик', () => {
    const state = createSoftErrorChain()
    advanceSoftErrorChain(state, msgs)
    recordSoftSuccess(state)
    expect(advanceSoftErrorChain(state, msgs).message).toBe(msgs.repeat)
  })

  it('reset обнуляет', () => {
    const state = createSoftErrorChain()
    advanceSoftErrorChain(state, msgs)
    resetSoftErrorChain(state)
    expect(state.wrongCount).toBe(0)
  })
})
