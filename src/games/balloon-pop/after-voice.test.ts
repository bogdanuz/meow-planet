import { describe, expect, it, vi } from 'vitest'
import { runAfterCurrentVoice } from './after-voice'

describe('runAfterCurrentVoice', () => {
  it('не меняет поле, пока фраза не доиграла', async () => {
    let finish!: () => void
    const wait = () =>
      new Promise<void>((resolve) => {
        finish = resolve
      })
    const action = vi.fn()
    const pending = runAfterCurrentVoice(wait, action, () => true)
    expect(action).not.toHaveBeenCalled()
    finish()
    await pending
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('не респаунит, если игру уже закрыли', async () => {
    const action = vi.fn()
    await runAfterCurrentVoice(async () => undefined, action, () => false)
    expect(action).not.toHaveBeenCalled()
  })
})
