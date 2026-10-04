import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderSettingsForm } from '../../src/app/parent/settings-form'
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from '../../src/shared/storage'
import { GALLERY_STAR_KEYS } from '../../src/shared/gallery-progress'

describe('настройки «Прятки»', () => {
  let host: HTMLDivElement
  let stored: Map<string, string>

  beforeEach(() => {
    stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
    host = document.createElement('div')
    document.body.append(host)
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'hide-seek' })
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
  })

  it('умолчания: «Легко», зеркало и подсказки включены; битые значения не ломают', () => {
    expect(DEFAULT_SETTINGS.hideSeekLevel).toBe('easy')
    expect(DEFAULT_SETTINGS.hideSeekMirror).toBe(true)
    expect(DEFAULT_SETTINGS.hideSeekAutoHints).toBe(true)
    const n = normalizeSettings({ hideSeekLevel: 'ultra', hideSeekMirror: 'yes', hideSeekAutoHints: 0 })
    expect(n.hideSeekLevel).toBe('easy')
    expect(n.hideSeekMirror).toBe(true)
    expect(n.hideSeekAutoHints).toBe(true)
  })

  it('раздел открыт сразу из игры', () => {
    const page = host.querySelector<HTMLElement>('.settings-page[data-section="hide-seek"]')!
    expect(page.hidden).toBe(false)
    expect(page.getAttribute('aria-label')).toBe('Прятки')
  })

  it('сложность Легко / Средне / Сложно сохраняется', () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('#hide-seek-level button')]
    expect(buttons.map((b) => b.textContent)).toEqual(['Легко', 'Средне', 'Сложно'])
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true')
    buttons[2]!.click()
    expect(loadSettings().hideSeekLevel).toBe('hard')
    expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true')
  })

  it('зеркальные сцены и подсказки сами выключаются', () => {
    const mirror = host.querySelector<HTMLInputElement>('#hide-seek-mirror')!
    const hints = host.querySelector<HTMLInputElement>('#hide-seek-hints')!
    expect(mirror.checked).toBe(true)
    expect(hints.checked).toBe(true)
    mirror.checked = false
    mirror.dispatchEvent(new Event('change'))
    hints.checked = false
    hints.dispatchEvent(new Event('change'))
    expect(loadSettings().hideSeekMirror).toBe(false)
    expect(loadSettings().hideSeekAutoHints).toBe(false)
  })

  it('«Начать заново» стирает звёздочки после подтверждения', async () => {
    stored.set(GALLERY_STAR_KEYS['hide-seek'], '["room"]')
    host.querySelector<HTMLButtonElement>('#hide-seek-reset-stars')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="yes"]')!.click()
    await vi.waitFor(() => expect(stored.has(GALLERY_STAR_KEYS['hide-seek'])).toBe(false))
  })

  it('«Сбросить настройки» возвращает «Легко» и включённые переключатели', () => {
    host.querySelector<HTMLButtonElement>('#hide-seek-level [data-level="medium"]')!.click()
    const mirror = host.querySelector<HTMLInputElement>('#hide-seek-mirror')!
    mirror.checked = false
    mirror.dispatchEvent(new Event('change'))
    const reset = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === 'Сбросить настройки',
    )!
    reset.click()
    expect(host.querySelector('#hide-seek-level [data-level="easy"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(mirror.checked).toBe(true)
  })
})
