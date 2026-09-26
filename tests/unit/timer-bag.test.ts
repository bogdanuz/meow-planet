import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTimerBag } from '../../src/shared/timer-bag'

describe('createTimerBag', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('clear снимает отложенный вызов', () => {
    vi.useFakeTimers()
    const bag = createTimerBag()
    const fn = vi.fn()
    bag.track(setTimeout(fn, 400))
    bag.clear()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
  })
})
