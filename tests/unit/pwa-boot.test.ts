import { afterEach, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { BOOT_ASSET_PATHS } from '../../src/app/boot-assets'

function mockPwaRegister(): void {
  vi.doMock('virtual:pwa-register', () => ({
    registerSW: vi.fn((options?: { onOfflineReady?: () => void }) => {
      options?.onOfflineReady?.()
      return () => {}
    }),
  }))
}

function defineNavigatorProperty(name: 'webdriver' | 'serviceWorker', value: unknown): void {
  Object.defineProperty(navigator, name, {
    value,
    configurable: true,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  globalThis.localStorage?.clear?.()

  try {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (navigator as any).webdriver
  } catch {
    // ignore
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (navigator as any).serviceWorker
  } catch {
    // ignore
  }
})

describe('runBootSequence', () => {
  it('не блокирует update-path, если уже есть активный controller', async () => {
    defineNavigatorProperty('webdriver', false)
    defineNavigatorProperty('serviceWorker', {
      controller: {},
      ready: Promise.resolve(),
    })
    mockPwaRegister()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: ['assets/shell/menu-bg.webp'] as const,
    }))

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({ ok: true })
    expect(steps[0]).toBe(0)
    expect(steps.at(-1)).toBe(100)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('тихо повторяет cold-start ошибку до 0% один раз', async () => {
    defineNavigatorProperty('webdriver', false)
    defineNavigatorProperty('serviceWorker', {
      ready: Promise.resolve(),
    })
    mockPwaRegister()

    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: ['assets/shell/menu-bg.webp'] as const,
    }))

    let attempts = 0
    const fetchMock = vi.fn(async () => {
      attempts += 1
      if (attempts === 1) {
        return {
          ok: false,
          headers: { get: (): string | null => null },
        }
      }

      return {
        ok: true,
        headers: { get: (): string | null => null },
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(steps[0]).toBe(0)
    expect(steps.at(-1)).toBe(100)
  })

  it('показывает контролируемую ошибку после двух cold-start провалов', async () => {
    defineNavigatorProperty('webdriver', false)
    defineNavigatorProperty('serviceWorker', {
      ready: Promise.resolve(),
    })
    mockPwaRegister()

    vi.doMock('../../src/app/boot-assets', () => ({
      BOOT_ASSET_PATHS: ['assets/shell/menu-bg.webp'] as const,
    }))

    const fetchMock = vi.fn(async () => ({
      ok: false,
      headers: { get: (): string | null => null },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { runBootSequence } = await import('../../src/app/pwa-boot')
    const steps: number[] = []

    const result = await runBootSequence(({ percent }) => steps.push(percent))

    expect(result).toEqual({
      ok: false,
      errorMessage: 'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
      failedAssets: expect.arrayContaining([expect.stringContaining('menu-bg.webp')]),
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(steps[0]).toBe(0)
    expect(steps.every((percent) => percent === 0)).toBe(true)
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
