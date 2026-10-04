import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { clearPuzzlePhotos } = vi.hoisted(() => ({ clearPuzzlePhotos: vi.fn(async () => undefined) }))
vi.mock('../../src/shared/puzzle-photos', () => ({ clearPuzzlePhotos }))

import { renderSettingsForm } from '../../src/app/parent/settings-form'
import { loadSettings } from '../../src/shared/storage'

describe('настройки «Собери пазл»', () => {
  let host: HTMLDivElement

  beforeEach(() => {
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
    clearPuzzlePhotos.mockClear()
    host = document.createElement('div')
    document.body.append(host)
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0' })
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
  })

  it('кусочки 4 / 6 / 9, по умолчанию 4, выбор сохраняется', () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('#puzzle-pieces button')]
    expect(buttons.map((b) => b.dataset.count)).toEqual(['4', '6', '9'])
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true')
    buttons[2]!.click()
    expect(loadSettings().puzzlePieceCount).toBe(9)
    expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true')
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('false')
  })

  it('подсказка включена по умолчанию и выключается', () => {
    const hint = host.querySelector<HTMLInputElement>('#puzzle-hint')!
    expect(hint.checked).toBe(true)
    hint.checked = false
    hint.dispatchEvent(new Event('change'))
    expect(loadSettings().puzzleTargetHint).toBe(false)
  })

  it('«Убрать свои фото» спрашивает и чистит только после «Убрать»', async () => {
    host.querySelector<HTMLButtonElement>('#puzzle-clear-photos')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="no"]')!.click()
    await Promise.resolve()
    expect(clearPuzzlePhotos).not.toHaveBeenCalled()

    host.querySelector<HTMLButtonElement>('#puzzle-clear-photos')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="yes"]')!.click()
    await vi.waitFor(() => expect(clearPuzzlePhotos).toHaveBeenCalledTimes(1))
  })

  it('«Сбросить настройки» возвращает 4 кусочка и подсказку', () => {
    host.querySelector<HTMLButtonElement>('#puzzle-pieces [data-count="6"]')!.click()
    const hint = host.querySelector<HTMLInputElement>('#puzzle-hint')!
    hint.checked = false
    hint.dispatchEvent(new Event('change'))
    const reset = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === 'Сбросить настройки',
    )!
    reset.click()
    expect(host.querySelector('#puzzle-pieces [data-count="4"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(hint.checked).toBe(true)
  })
})
