import { afterEach, describe, expect, it, vi } from 'vitest'

type Progress = {
  percent: number
  message: string
  doneCount?: number
  totalCount?: number
}

function defineServiceWorker(value: unknown): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    value,
    configurable: true,
  })
}

function manifestResponse(urls: string[], ok = true) {
  return {
    ok,
    json: async () => ({ version: 1, urls }),
  }
}

function appUrl(path: string): string {
  return new URL(`/assets/${path}`, window.location.origin).toString()
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  try {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (navigator as any).serviceWorker
  } catch {
    // ignore
  }
})

describe('runBootSequence', () => {
  it('на dev-server не ждёт Workbox Cache Storage, потому что PWA там выключена', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => manifestResponse(['assets/shell/welcome-bg.webp'])),
    )
    const readWorkboxCachedUrls = vi.fn(async () => new Set<string>())
    const reports: Progress[] = []
    const { runBootSequence } = await import('../../src/app/pwa-boot')

    await expect(
      runBootSequence((progress) => reports.push(progress), {
        isDevelopment: true,
        waitForServiceWorkerReady: async () => true,
        readWorkboxCachedUrls,
        waitForNextCachePoll: async () => {},
      }),
    ).resolves.toEqual({ ok: true })
    expect(readWorkboxCachedUrls).not.toHaveBeenCalled()
    expect(reports.at(-1)).toMatchObject({
      percent: 100,
      doneCount: 1,
      totalCount: 1,
    })
  })

  it('считает только реальные записи Workbox Cache Storage без повторной загрузки ассетов', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    const manifestUrls = [
      'assets/shell/menu-bg.webp',
      'assets/shell/welcome-bg.webp',
    ]
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('precache-manifest.json')
      return manifestResponse(manifestUrls)
    })
    vi.stubGlobal('fetch', fetchMock)

    let finishReady: ((ready: boolean) => void) | undefined
    let cacheRead = 0
    const reports: Progress[] = []
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const result = await runBootSequence((progress) => reports.push(progress), {
      isDevelopment: false,
      waitForServiceWorkerReady: () =>
        new Promise<boolean>((resolve) => {
          finishReady = resolve
        }),
      readWorkboxCachedUrls: async () => {
        cacheRead += 1
        if (cacheRead === 1) return new Set<string>()
        if (cacheRead === 2) return new Set([appUrl('shell/menu-bg.webp')])
        finishReady?.(true)
        return new Set(manifestUrls.map((url) => new URL(`/${url}`, window.location.origin).toString()))
      },
      waitForNextCachePoll: async () => {},
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(reports).toContainEqual({
      percent: 50,
      message: 'Подготавливаем игру',
      doneCount: 1,
      totalCount: 2,
    })
    expect(reports.at(-1)).toEqual({
      percent: 100,
      message: 'Все файлы готовы',
      doneCount: 2,
      totalCount: 2,
    })
  })

  it('warm-controller не публикует 100% до readiness активного SW', async () => {
    let confirmReady: ((ready: boolean) => void) | undefined
    defineServiceWorker({ controller: {}, ready: Promise.resolve() })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []
    const resultPromise = runBootSequence(
      ({ percent }) => steps.push(percent),
      {
        isDevelopment: false,
        waitForServiceWorkerReady: () =>
          new Promise<boolean>((resolve) => {
            confirmReady = resolve
          }),
      },
    )

    await vi.waitFor(() => expect(confirmReady).toBeTypeOf('function'))
    expect(steps).not.toContain(100)
    confirmReady?.(true)
    await expect(resultPromise).resolves.toEqual({ ok: true })
    expect(steps.at(-1)).toBe(100)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('не публикует 100%, пока offline-ready не подтверждён, даже если весь cache заполнен', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => manifestResponse(['assets/shell/menu-bg.webp'])),
    )
    let confirmReady: ((ready: boolean) => void) | undefined
    const steps: number[] = []
    let checkedBeforeReady = false
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const result = await runBootSequence(
      ({ percent }) => {
        steps.push(percent)
        if (percent === 99) {
          expect(steps).not.toContain(100)
          checkedBeforeReady = true
          confirmReady?.(true)
        }
      },
      {
        isDevelopment: false,
        waitForServiceWorkerReady: () =>
          new Promise<boolean>((resolve) => {
            confirmReady = resolve
          }),
        readWorkboxCachedUrls: async () =>
          new Set([appUrl('shell/menu-bg.webp')]),
        waitForNextCachePoll: async () => {},
      },
    )

    expect(result).toEqual({ ok: true })
    expect(checkedBeforeReady).toBe(true)
    expect(steps).toContain(99)
    expect(steps.at(-1)).toBe(100)
  })

  it('не подменяет отсутствующие cache entries готовым счётчиком после readiness', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        manifestResponse([
          'assets/shell/menu-bg.webp',
          'assets/shell/welcome-bg.webp',
        ]),
      ),
    )
    const steps: number[] = []
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const result = await runBootSequence(
      ({ percent }) => steps.push(percent),
      {
        isDevelopment: false,
        waitForServiceWorkerReady: async () => true,
        readWorkboxCachedUrls: async () =>
          new Set([appUrl('shell/menu-bg.webp')]),
        waitForNextCachePoll: async () => {},
      },
    )

    expect(result).toMatchObject({ ok: false })
    expect(steps).not.toContain(100)
  })

  it('превращает ошибку чтения Cache Storage в контролируемый boot error', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => manifestResponse(['assets/shell/menu-bg.webp'])),
    )
    const { runBootSequence } = await import('../../src/app/pwa-boot')

    await expect(
      runBootSequence(() => {}, {
        isDevelopment: false,
        waitForServiceWorkerReady: async () => true,
        readWorkboxCachedUrls: async () => {
          throw new Error('Cache Storage unavailable')
        },
        waitForNextCachePoll: async () => {},
      }),
    ).resolves.toMatchObject({ ok: false })
  })

  it('тихо повторяет первый сбой загрузки manifest и затем завершает boot', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    let manifestAttempts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        manifestAttempts += 1
        return manifestResponse(
          ['assets/shell/menu-bg.webp'],
          manifestAttempts > 1,
        )
      }),
    )
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const result = await runBootSequence(() => {}, {
      isDevelopment: false,
      waitForServiceWorkerReady: async () => true,
      readWorkboxCachedUrls: async () =>
        new Set([appUrl('shell/menu-bg.webp')]),
      waitForNextCachePoll: async () => {},
    })

    expect(result).toEqual({ ok: true })
    expect(manifestAttempts).toBe(2)
  })

  it('после двух сбоев manifest показывает контролируемую ошибку', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    const fetchMock = vi.fn(async () => manifestResponse([], false))
    vi.stubGlobal('fetch', fetchMock)
    const { runBootSequence } = await import('../../src/app/pwa-boot')

    await expect(
      runBootSequence(() => {}, {
        isDevelopment: false,
        waitForServiceWorkerReady: async () => false,
        readWorkboxCachedUrls: async () => new Set(),
        waitForNextCachePoll: async () => {},
      }),
    ).resolves.toEqual({
      ok: false,
      errorMessage:
        'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('не публикует 100% при отказе SW readiness', async () => {
    defineServiceWorker({ ready: Promise.resolve() })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => manifestResponse(['assets/shell/menu-bg.webp'])),
    )
    const steps: number[] = []
    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const result = await runBootSequence(
      ({ percent }) => steps.push(percent),
      {
        isDevelopment: false,
        waitForServiceWorkerReady: async () => false,
        readWorkboxCachedUrls: async () =>
          new Set([appUrl('shell/menu-bg.webp')]),
        waitForNextCachePoll: async () => {},
      },
    )

    expect(result).toMatchObject({ ok: false })
    expect(steps).not.toContain(100)
  })
})
