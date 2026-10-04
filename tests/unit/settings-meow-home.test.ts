import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// «В гости» пока закрыт заглушкой — раздел проверяем так, будто игра уже в релизе.
vi.mock('../../src/content/released-games', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/content/released-games')>()),
  isGameReleased: () => true,
}))

const { renderSettingsForm } = await import('../../src/app/parent/settings-form')
const { DEFAULT_SETTINGS, loadSettings, normalizeSettings } = await import('../../src/shared/storage')

describe('настройки «В гости»', () => {
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
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'meow-home' })
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
  })

  it('умолчания: горшок, желания, день/ночь по часам и сезон по дате включены; битые значения не ломают', () => {
    expect(DEFAULT_SETTINGS.meowHomePotty).toBe(true)
    expect(DEFAULT_SETTINGS.meowHomeWishes).toBe(true)
    expect(DEFAULT_SETTINGS.meowHomeRealTime).toBe(true)
    expect(DEFAULT_SETTINGS.meowHomeSeasonByDate).toBe(true)
    const n = normalizeSettings({ meowHomePotty: 'no', meowHomeWishes: 0, meowHomeRealTime: null, meowHomeSeasonByDate: 'x' })
    expect(n.meowHomePotty).toBe(true)
    expect(n.meowHomeWishes).toBe(true)
    expect(n.meowHomeRealTime).toBe(true)
    expect(n.meowHomeSeasonByDate).toBe(true)
  })

  it('раздел открыт сразу из игры', () => {
    const page = host.querySelector<HTMLElement>('.settings-page[data-section="meow-home"]')!
    expect(page.hidden).toBe(false)
    expect(page.getAttribute('aria-label')).toBe('В гости')
  })

  it('четыре переключателя сохраняются', () => {
    for (const [id, key] of [
      ['meow-home-potty', 'meowHomePotty'],
      ['meow-home-wishes', 'meowHomeWishes'],
      ['meow-home-realtime', 'meowHomeRealTime'],
      ['meow-home-season-date', 'meowHomeSeasonByDate'],
    ] as const) {
      const input = host.querySelector<HTMLInputElement>(`#${id}`)!
      expect(input.checked).toBe(true)
      input.checked = false
      input.dispatchEvent(new Event('change'))
      expect(loadSettings()[key]).toBe(false)
    }
  })
})
