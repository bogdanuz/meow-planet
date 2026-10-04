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
    const order: string[] = []
    const finish = vi.fn(async () => {
      order.push('finish')
    })
    const unmount = vi.fn(() => {
      order.push('unmount')
    })
    const renderShell = vi.fn(() => {
      order.push('shell')
      return vi.fn()
    })

    vi.doMock('../../src/app/boot-loader', () => ({
      mountBootLoader: vi.fn(() => ({
        setProgress,
        setError,
        setRetryHandler,
        finish,
        unmount,
      })),
    }))
    vi.doMock('../../src/app/pwa-boot', () => ({
      hasActiveServiceWorkerController: vi.fn(() => false),
      runBootSequence: vi.fn(async (report: (progress: { percent: number; message: string }) => void) => {
        report({ percent: 100, message: 'Готово!' })
        return { ok: true } as const
      }),
    }))
    vi.doMock('../../src/app/shell', () => ({
      renderShell,
    }))

    await import('../../src/main')
    await vi.waitFor(() => expect(renderShell).toHaveBeenCalledTimes(1))

    expect(setProgress).toHaveBeenCalledWith({ percent: 100, message: 'Готово!' })
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(renderShell).toHaveBeenCalledWith(root)
    // Welcome строится под финалом совы — к уходу экрана загрузки он уже готов.
    expect(order).toEqual(['finish', 'shell', 'unmount'])
  })

  it('после ошибки сам продолжает загрузку по событию online и не запускает её дважды', async () => {
    const root = document.createElement('div')
    root.id = 'app'
    document.body.append(root)

    const setError = vi.fn()
    let retry: (() => void) | undefined
    const renderShell = vi.fn(() => vi.fn())
    vi.doMock('../../src/app/boot-loader', () => ({
      mountBootLoader: vi.fn(() => ({
        setProgress: vi.fn(),
        setError,
        setRetryHandler: (handler: () => void) => {
          retry = handler
        },
        finish: vi.fn(async () => undefined),
        unmount: vi.fn(),
      })),
    }))
    let calls = 0
    let finishSecond: ((value: { ok: true }) => void) | undefined
    const runBootSequence = vi.fn(async () => {
      calls += 1
      if (calls === 1) return { ok: false, errorMessage: 'Связь прервалась.' } as const
      return new Promise<{ ok: true }>((resolve) => {
        finishSecond = resolve
      })
    })
    vi.doMock('../../src/app/pwa-boot', () => ({
      hasActiveServiceWorkerController: vi.fn(() => false),
      runBootSequence,
    }))
    vi.doMock('../../src/app/shell', () => ({ renderShell }))

    await import('../../src/main')
    await vi.waitFor(() => expect(setError).toHaveBeenCalledWith('Связь прервалась.'))

    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('online'))
    retry?.()
    expect(runBootSequence).toHaveBeenCalledTimes(2)

    finishSecond?.({ ok: true })
    await vi.waitFor(() => expect(renderShell).toHaveBeenCalledWith(root))
    window.dispatchEvent(new Event('online'))
    expect(runBootSequence).toHaveBeenCalledTimes(2)
  })

  it('при warm start не монтирует сцену уборки', async () => {
    const root = document.createElement('div')
    root.id = 'app'
    document.body.append(root)

    const mountBootLoader = vi.fn()
    const renderShell = vi.fn(() => vi.fn())
    vi.doMock('../../src/app/boot-loader', () => ({
      mountBootLoader,
    }))
    vi.doMock('../../src/app/pwa-boot', () => ({
      hasActiveServiceWorkerController: vi.fn(() => true),
      runBootSequence: vi.fn(async () => ({ ok: true }) as const),
    }))
    vi.doMock('../../src/app/shell', () => ({
      renderShell,
    }))

    await import('../../src/main')
    await Promise.resolve()

    expect(mountBootLoader).not.toHaveBeenCalled()
    expect(renderShell).toHaveBeenCalledWith(root)
  })
})
