import { describe, expect, it, vi } from 'vitest'
import { runBootSequence } from '../../src/app/pwa-boot'
import { BOOT_ASSET_PATHS } from '../../src/app/boot-assets'
import { existsSync } from 'node:fs'
import path from 'node:path'

describe('runBootSequence', () => {
  it('стартует с 0 и доходит до 100, когда ресурсы загрузились', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true }),
    )
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          this.onload?.()
        }
      },
    )
    const steps: number[] = []
    await runBootSequence(({ percent }) => {
      steps.push(percent)
    })
    expect(steps[0]).toBe(0)
    expect(steps.at(-1)).toBe(100)
    vi.unstubAllGlobals()
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
