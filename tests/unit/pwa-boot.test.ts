import { describe, expect, it, vi } from 'vitest'
import { BOOT_ASSET_PATHS } from '../../src/app/boot-assets'
import { existsSync } from 'node:fs'
import path from 'node:path'

describe('runBootSequence', () => {
  it('стартует с 0 и доходит до 100, когда ресурсы загрузились', async () => {
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
