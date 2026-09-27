import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOOT_ASSET_PATHS } from '../../src/app/boot-assets'
import { existsSync } from 'node:fs'
import path from 'node:path'

describe('runBootSequence', () => {
  afterEach(() => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
  })

  it('стартует с 0 и доходит до 100, когда ресурсы загрузились', async () => {
    const prevWebDriver = (navigator as any).webdriver
    try {
      Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    } catch {
      // ignore: в jsdom webdriver может быть уже определён или не переопределяться
    }

    vi.resetModules()
    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: [
        'assets/shell/coming-soon.jpg',
        'assets/shell/menu-bg.webp',
      ] as const,
    }))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async (_url: string, opts?: { method?: string }) => {
          const method = opts?.method?.toUpperCase() ?? 'GET'
          const contentLength = 1024

          if (method === 'HEAD') {
            return {
              ok: true,
              headers: {
                get: (name: string) =>
                  name.toLowerCase() === 'content-length'
                    ? String(contentLength)
                    : null,
              },
            }
          }

          let done = false
          const reader = {
            read: async () => {
              if (done) return { done: true, value: undefined }
              done = true
              return {
                done: false,
                value: new Uint8Array(contentLength),
              }
            },
          }

          return {
            ok: true,
            body: {
              getReader: () => reader,
            },
            headers: { get: () => null },
            blob: async () =>
              new Blob([new Uint8Array(contentLength)]),
          }
        },
      ),
    )

    const { runBootSequence } = await import('../../src/app/pwa-boot')

    const steps: number[] = []
    await runBootSequence(({ percent }) => steps.push(percent))
    expect(steps[0]).toBe(0)
    expect(steps.at(-1)).toBe(100)

    vi.unstubAllGlobals()
    vi.resetModules()

    try {
      if (prevWebDriver === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (navigator as any).webdriver
      } else {
        Object.defineProperty(navigator, 'webdriver', {
          value: prevWebDriver,
          configurable: true,
        })
      }
    } catch {
      // ignore
    }
  })

  it('не скачивает ассеты заново, если precache уже тёплый', async () => {
    const prevWebDriver = (navigator as any).webdriver
    try {
      Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
    } catch {
      // ignore
    }

    vi.resetModules()
    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: ['assets/shell/menu-bg.webp'] as const,
    }))

    const swText =
      'self.__WB_MANIFEST;precacheAndRoute([{url:"assets/shell/menu-bg.webp",revision:"abc"}],{})'
    let downloaded = false
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/sw.js')) {
        return {
          ok: true,
          text: async (): Promise<string> => swText,
          headers: { get: (): string | null => null },
        }
      }

      downloaded = true
      return {
        ok: true,
        headers: { get: (): string | null => null },
      }
    })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('caches', {
      keys: vi.fn(async () => ['workbox-precache-v2-http://localhost/']),
      open: vi.fn(async () => ({
        match: vi.fn(async (_request: string, options?: { ignoreSearch?: boolean }) =>
          options?.ignoreSearch ? {} : downloaded ? {} : null,
        ),
      })),
    })

    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: new Promise<void>(() => {}) },
        configurable: true,
      })
    } catch {
      // ignore
    }

    const { runBootSequence } = await import('../../src/app/pwa-boot')

    const steps: number[] = []
    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(steps.at(-1)).toBe(100)

    vi.unstubAllGlobals()
    vi.resetModules()

    try {
      if (prevWebDriver === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (navigator as any).webdriver
      } else {
        Object.defineProperty(navigator, 'webdriver', {
          value: prevWebDriver,
          configurable: true,
        })
      }
    } catch {
      // ignore
    }
  })

  it('тихо повторяет cold-start ошибку до 0% один раз', async () => {
    const prevWebDriver = (navigator as any).webdriver
    try {
      Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
    } catch {
      // ignore
    }

    vi.resetModules()
    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: ['assets/shell/menu-bg.webp'] as const,
    }))

    const swText =
      'self.__WB_MANIFEST;precacheAndRoute([{url:"assets/shell/menu-bg.webp",revision:"abc"}],{})'
    let swFetchAttempts = 0
    let assetFetches = 0
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/sw.js')) {
        swFetchAttempts += 1
        if (swFetchAttempts === 1) {
          return {
            ok: false,
            headers: { get: (): string | null => null },
          }
        }

        return {
          ok: true,
          text: async (): Promise<string> => swText,
          headers: { get: (): string | null => null },
        }
      }

      assetFetches += 1
      return {
        ok: true,
        headers: { get: (): string | null => null },
      }
    })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('caches', {
      keys: vi.fn(async () => ['workbox-precache-v2-http://localhost/']),
      open: vi.fn(async () => ({
        match: vi.fn(async (_request: string, options?: { ignoreSearch?: boolean }) =>
          options?.ignoreSearch ? {} : null,
        ),
      })),
    })

    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.resolve() },
        configurable: true,
      })
    } catch {
      // ignore
    }

    const { runBootSequence } = await import('../../src/app/pwa-boot')

    const steps: number[] = []
    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({ ok: true })
    expect(swFetchAttempts).toBe(2)
    expect(assetFetches).toBe(0)
    expect(steps.at(-1)).toBe(100)

    vi.unstubAllGlobals()
    vi.resetModules()

    try {
      if (prevWebDriver === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (navigator as any).webdriver
      } else {
        Object.defineProperty(navigator, 'webdriver', {
          value: prevWebDriver,
          configurable: true,
        })
      }
    } catch {
      // ignore
    }
  })

  it('после download проверяет только sentinel, а не весь precache-list', async () => {
    const prevWebDriver = (navigator as any).webdriver
    try {
      Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
    } catch {
      // ignore
    }

    vi.resetModules()
    const assets = Array.from({ length: 50 }, (_, index) => `assets/shell/mock-${index}.webp`)
    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: assets,
    }))

    const swText = `self.__WB_MANIFEST;precacheAndRoute([${assets
      .map((url) => `{url:"${url}",revision:"abc"}`)
      .join(',')}],{})`
    let downloaded = false
    let matchCount = 0
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/sw.js')) {
        return {
          ok: true,
          text: async (): Promise<string> => swText,
          headers: { get: (): string | null => null },
        }
      }

      downloaded = true
      return {
        ok: true,
        headers: { get: (): string | null => null },
      }
    })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('caches', {
      keys: vi.fn(async () => ['workbox-precache-v2-http://localhost/']),
      open: vi.fn(async () => ({
        match: vi.fn(async () => {
          matchCount += 1
          return downloaded ? {} : null
        }),
      })),
    })

    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.resolve() },
        configurable: true,
      })
    } catch {
      // ignore
    }

    const { runBootSequence } = await import('../../src/app/pwa-boot')

    const result = await runBootSequence(() => {})

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(51)
    expect(matchCount).toBeLessThanOrEqual(12)

    vi.unstubAllGlobals()
    vi.resetModules()

    try {
      if (prevWebDriver === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (navigator as any).webdriver
      } else {
        Object.defineProperty(navigator, 'webdriver', {
          value: prevWebDriver,
          configurable: true,
        })
      }
    } catch {
      // ignore
    }
  })

  it('список boot содержит файлы готовых игр', () => {
    const root = path.join('public')
    expect(BOOT_ASSET_PATHS.some((p) => p.includes('coming-soon.jpg'))).toBe(true)
    expect(BOOT_ASSET_PATHS.some((p) => p.includes('balloon-sky-bg'))).toBe(true)
    expect(BOOT_ASSET_PATHS.some((p) => p.includes('sound-world'))).toBe(true)
    for (const rel of [
      'assets/shell/coming-soon.jpg',
      'assets/shell/menu-bg.webp',
      'assets/games/balloon-pop/balloon-red.png',
    ]) {
      expect(existsSync(path.join(root, rel)), rel).toBe(true)
      expect(BOOT_ASSET_PATHS).toContain(rel)
    }
  })
})
