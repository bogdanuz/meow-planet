import { afterEach, describe, expect, it, vi } from 'vitest'

type RegisterOptions = {
  onOfflineReady?: () => void
}

function mockPwaRegister(onRegister?: (options: RegisterOptions) => void): void {
  vi.doMock('virtual:pwa-register', () => ({
    registerSW: vi.fn((options?: RegisterOptions) => {
      if (options) onRegister?.(options)
      else onRegister?.({})
      return () => {}
    }),
  }))
}

function defineServiceWorker(value: unknown): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    value,
    configurable: true,
  })
}

function manifestResponse(urls: string[]): {
  ok: true
  json: () => Promise<{ version: 1; urls: string[] }>
} {
  return {
    ok: true,
    json: async () => ({ version: 1, urls }),
  }
}

function assetResponse(ok = true): {
  ok: boolean
  headers: { get: () => null }
  arrayBuffer: () => Promise<ArrayBuffer>
} {
  return {
    ok,
    headers: { get: () => null },
    arrayBuffer: async () => new ArrayBuffer(1),
  }
}

function pendingPromise<T>(): Promise<T> {
  return new Promise<T>(() => {})
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  globalThis.localStorage?.clear?.()

  try {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (navigator as any).serviceWorker
  } catch {
    // ignore
  }
})

describe('runBootSequence', () => {
  it('warm-controller не публикует 100% до readiness активного SW', async () => {
    let confirmReady: ((ready: boolean) => void) | undefined
    defineServiceWorker({
      controller: {},
      ready: Promise.resolve(),
    })
    mockPwaRegister()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const resultPromise = runBootSequence(
      ({ percent }) => steps.push(percent),
      {
        waitForServiceWorkerReady: () =>
          new Promise<boolean>((resolve) => {
            confirmReady = resolve
          }),
      },
    )

    await vi.waitFor(() => expect(confirmReady).toBeTypeOf('function'))
    expect(steps[0]).toBe(0)
    expect(steps).not.toContain(100)
    confirmReady?.(true)

    await expect(resultPromise).resolves.toEqual({ ok: true })
    expect(steps.at(-1)).toBe(100)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('тихо повторяет cold-start ошибку до 0% один раз', async () => {
    defineServiceWorker({
      ready: Promise.resolve(),
    })
    mockPwaRegister((options) => options.onOfflineReady?.())

    let assetAttempts = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('precache-manifest.json')) {
        return manifestResponse(['assets/shell/menu-bg.webp'])
      }
      assetAttempts += 1
      return assetResponse(assetAttempts > 1)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({ ok: true })
    expect(assetAttempts).toBe(2)
    expect(steps[0]).toBe(0)
    expect(steps.at(-1)).toBe(100)
  })

  it('показывает контролируемую ошибку после двух cold-start провалов', async () => {
    defineServiceWorker({
      ready: Promise.resolve(),
    })
    mockPwaRegister((options) => options.onOfflineReady?.())

    let assetAttempts = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('precache-manifest.json')) {
        return manifestResponse(['assets/shell/menu-bg.webp'])
      }
      assetAttempts += 1
      return assetResponse(false)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({
      ok: false,
      errorMessage: 'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
      failedAssets: expect.arrayContaining([expect.stringContaining('menu-bg.webp')]),
    })
    expect(assetAttempts).toBe(2)
    expect(steps[0]).toBe(0)
    expect(steps.every((percent) => percent === 0)).toBe(true)
  })

  it('не делает полный retry после частичного подтверждённого прогресса', async () => {
    defineServiceWorker({
      ready: Promise.resolve(),
    })
    mockPwaRegister((options) => options.onOfflineReady?.())

    const attempts = new Map<string, number>()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('precache-manifest.json')) {
          return manifestResponse([
            'assets/shell/welcome-bg.webp',
            'assets/shell/missing.webp',
          ])
        }
        attempts.set(url, (attempts.get(url) ?? 0) + 1)
        return assetResponse(!url.endsWith('/missing.webp'))
      }),
    )

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []
    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toMatchObject({ ok: false })
    expect([...attempts.values()]).toEqual([1, 1])
    expect(steps).toContain(50)
  })

  it('не публикует 100% при отказе SW readiness', async () => {
    defineServiceWorker({
      ready: pendingPromise<ServiceWorkerRegistration>(),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        return url.includes('precache-manifest.json')
          ? manifestResponse(['assets/shell/menu-bg.webp'])
          : assetResponse()
      }),
    )

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []
    const result = await runBootSequence(
      ({ percent }) => steps.push(percent),
      { waitForServiceWorkerReady: async () => false },
    )

    expect(result).toMatchObject({ ok: false })
    expect(steps).not.toContain(100)
  })

  it('не публикует 100% до подтверждения offline-ready', async () => {
    let confirmOfflineReady: ((ready: boolean) => void) | undefined
    defineServiceWorker({
      ready: pendingPromise<ServiceWorkerRegistration>(),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        return url.includes('precache-manifest.json')
          ? manifestResponse(['assets/shell/menu-bg.webp'])
          : assetResponse()
      }),
    )

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []
    const resultPromise = runBootSequence(
      ({ percent }) => steps.push(percent),
      {
        waitForServiceWorkerReady: () =>
          new Promise<boolean>((resolve) => {
            confirmOfflineReady = resolve
          }),
      },
    )

    await vi.waitFor(() => {
      expect(confirmOfflineReady).toBeTypeOf('function')
    })
    expect(steps).not.toContain(100)

    confirmOfflineReady?.(true)
    await expect(resultPromise).resolves.toEqual({ ok: true })
    expect(steps.at(-1)).toBe(100)
  })
})
