import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundWorldGame } from '../../src/games/sound-world'
import { resetSfxInventoryCacheForTests } from '../../src/games/sound-world/sfx-inventory'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

describe('sound-world unmount', () => {
  afterEach(() => {
    soundWorldGame.unmount()
    resetSfxInventoryCacheForTests()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('не обновляет экран, если инвентарь пришёл после выхода', async () => {
    resetSfxInventoryCacheForTests()
    let releaseInventory: (() => void) | undefined
    let inventorySettled = false
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        if (!inventorySettled) {
          return new Promise<Response>((resolve) => {
            releaseInventory = () => {
              inventorySettled = true
              resolve(
                new Response(JSON.stringify(['cat']), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                }),
              )
            }
          })
        }
        return Promise.resolve(new Response(null, { status: 404 }))
      }),
    )

    const host = document.createElement('div')
    soundWorldGame.mount(host, {
      settings: { ...DEFAULT_SETTINGS, soundEnabled: false, musicEnabled: false },
    })
    soundWorldGame.unmount()

    releaseInventory?.()
    await new Promise((r) => setTimeout(r, 20))

    expect(host.childElementCount).toBe(0)
  })
})
