import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFrameBatch } from '../../src/shared/frame-batch'

describe('createFrameBatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFrames() {
    const queue = new Map<number, FrameRequestCallback>()
    let id = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      id += 1
      queue.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      queue.delete(handle)
    })
    return {
      flush() {
        const callbacks = [...queue.values()]
        queue.clear()
        for (const cb of callbacks) cb(performance.now())
      },
      pending: () => queue.size,
    }
  }

  it('сколько ни проси за кадр — работа выполняется один раз', () => {
    const frames = stubFrames()
    const work = vi.fn()
    const batch = createFrameBatch(work)

    batch.request()
    batch.request()
    batch.request()
    expect(work).not.toHaveBeenCalled()
    expect(frames.pending()).toBe(1)

    frames.flush()
    expect(work).toHaveBeenCalledTimes(1)

    batch.request()
    frames.flush()
    expect(work).toHaveBeenCalledTimes(2)
  })

  it('flush выполняет отложенное сразу и снимает кадр; cancel — просто снимает', () => {
    const frames = stubFrames()
    const work = vi.fn()
    const batch = createFrameBatch(work)

    batch.request()
    batch.flush()
    expect(work).toHaveBeenCalledTimes(1)
    expect(frames.pending()).toBe(0)

    batch.flush()
    expect(work).toHaveBeenCalledTimes(1)

    batch.request()
    batch.cancel()
    frames.flush()
    expect(work).toHaveBeenCalledTimes(1)
  })
})
