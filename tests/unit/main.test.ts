import { afterEach, describe, expect, it, vi } from 'vitest'

describe('app bootstrap', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('unmounts boot loader and renders shell after successful boot', async () => {
    const root = document.createElement('div')
    root.id = 'app'
    document.body.append(root)

    const setProgress = vi.fn()
    const setError = vi.fn()
    const setRetryHandler = vi.fn()
    const unmount = vi.fn()
    const renderShell = vi.fn(() => vi.fn())

    vi.doMock('../../src/app/boot-loader', () => ({
      mountBootLoader: vi.fn(() => ({
        setProgress,
        setError,
        setRetryHandler,
        unmount,
      })),
    }))
    vi.doMock('../../src/app/pwa-boot', () => ({
      runBootSequence: vi.fn(async (report: (progress: { percent: number; message: string }) => void) => {
        report({ percent: 100, message: 'Готово!' })
        return { ok: true } as const
      }),
    }))
    vi.doMock('../../src/app/shell', () => ({
      renderShell,
    }))

    await import('../../src/main')
    await Promise.resolve()

    expect(setProgress).toHaveBeenCalledWith({ percent: 100, message: 'Готово!' })
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(renderShell).toHaveBeenCalledTimes(1)
    expect(renderShell).toHaveBeenCalledWith(root)
  })
})
