import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderSettingsForm } from '../../src/app/parent/settings-form'
import { loadSettings } from '../../src/shared/storage'

describe('настройки «Учимся считать»', () => {
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
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'counting' })
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
  })

  it('раздел открыт сразу из игры', () => {
    const page = host.querySelector<HTMLElement>('.settings-page[data-section="counting"]')!
    expect(page.hidden).toBe(false)
    expect(page.getAttribute('aria-label')).toBe('Учимся считать')
  })

  it('«Считаем до» 3 / 5 / 10 сохраняется, по умолчанию до 3', () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('#counting-limit button')]
    expect(buttons.map((b) => b.textContent)).toEqual(['до 3', 'до 5', 'до 10'])
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true')
    buttons[2]!.click()
    expect(loadSettings().countingLimit).toBe(10)
    expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true')
  })

  it('пять видов заданий; для 2 лет включены «Положи», «Посчитай», «Добавь/убери»', () => {
    const rows = [...host.querySelectorAll<HTMLInputElement>('input[id^="counting-task-"]')]
    expect(rows).toHaveLength(5)
    expect(rows.filter((r) => r.checked).map((r) => r.id)).toEqual([
      'counting-task-give',
      'counting-task-count',
      'counting-task-addRemove',
    ])
    const compare = host.querySelector<HTMLInputElement>('#counting-task-compare')!
    compare.checked = true
    compare.dispatchEvent(new Event('change'))
    const count = host.querySelector<HTMLInputElement>('#counting-task-count')!
    count.checked = false
    count.dispatchEvent(new Event('change'))
    expect(loadSettings().countingTasks).toEqual(['give', 'addRemove', 'compare'])
  })

  it('«Подсказки сами» выключаются, «Сбросить настройки» всё возвращает', () => {
    const hints = host.querySelector<HTMLInputElement>('#counting-hints')!
    expect(hints.checked).toBe(true)
    hints.checked = false
    hints.dispatchEvent(new Event('change'))
    expect(loadSettings().countingAutoHints).toBe(false)
    host.querySelector<HTMLButtonElement>('#counting-limit [data-limit="5"]')!.click()
    const give = host.querySelector<HTMLInputElement>('#counting-task-give')!
    give.checked = false
    give.dispatchEvent(new Event('change'))
    const reset = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === 'Сбросить настройки',
    )!
    reset.click()
    expect(host.querySelector('#counting-limit [data-limit="3"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(give.checked).toBe(true)
    expect(hints.checked).toBe(true)
  })
})
