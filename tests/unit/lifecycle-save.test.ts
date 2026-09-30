import { afterEach, describe, expect, it } from 'vitest'
import { bindLifecycleSave } from '../../src/shared/lifecycle-save'

describe('lifecycle save', () => {
  afterEach(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('сохраняет работу, когда экран скрывают', () => {
    let saves = 0
    const stop = bindLifecycleSave(() => {
      saves += 1
    })
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pagehide'))
    expect(saves).toBe(2)
    stop()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(saves).toBe(2)
  })
})
