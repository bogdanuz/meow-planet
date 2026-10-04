import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hub = vi.hoisted(() => ({ playHubMusic: vi.fn(), playGameMusic: vi.fn() }))

vi.mock('../../src/shared/hub-sounds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/shared/hub-sounds')>()),
  playHubMusic: hub.playHubMusic,
  playGameMusic: hub.playGameMusic,
}))

import { renderShell } from '../../src/app/shell'
import { DEFAULT_SETTINGS, saveSettings } from '../../src/shared/storage'

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('Музыка хаба после фона и после включения в настройках', () => {
  let stop: () => void = () => undefined

  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, String(v)),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() {
        return data.size
      },
    })
    saveSettings({ ...DEFAULT_SETTINGS, musicEnabled: true, soundEnabled: true })
    window.location.hash = '#/menu'
    document.body.replaceChildren()
    hub.playHubMusic.mockClear()
  })

  afterEach(() => {
    stop()
    setHidden(false)
    vi.unstubAllGlobals()
  })

  it('iPad уснул и проснулся: первый тап снова включает музыку меню', () => {
    const root = document.createElement('div')
    document.body.append(root)
    stop = renderShell(root)
    window.dispatchEvent(new Event('pointerdown'))
    setHidden(true)
    setHidden(false)
    hub.playHubMusic.mockClear()
    window.dispatchEvent(new Event('pointerdown'))
    expect(hub.playHubMusic).toHaveBeenCalledTimes(1)
  })

  it('музыку выключили и включили в настройках — она снова играет', async () => {
    window.location.hash = '#/parent'
    const root = document.createElement('div')
    document.body.append(root)
    stop = renderShell(root)
    const music = root.querySelector<HTMLInputElement>('#music-enabled')!
    music.click()
    hub.playHubMusic.mockClear()
    music.click()
    expect(hub.playHubMusic).toHaveBeenCalled()
  })
})
