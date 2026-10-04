import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/shared/puzzle-photos', () => ({ clearPuzzlePhotos: vi.fn(async () => undefined) }))
vi.mock('../../src/shared/sandbox-photos', () => ({ clearSandboxPhotos: vi.fn(async () => undefined) }))

import { renderSettingsForm } from '../../src/app/parent/settings-form'
import { GALLERY_STAR_KEYS } from '../../src/shared/gallery-progress'
import { clearSandboxPhotos } from '../../src/shared/sandbox-photos'
import { loadSettings } from '../../src/shared/storage'

describe('настройки «Собери что угодно!»', () => {
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
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'shape-build' })
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
    vi.mocked(clearSandboxPhotos).mockClear()
  })

  it('раздел называется по-новому', () => {
    expect(host.querySelector('.settings-nav__item[data-section="shape-build"]')!.textContent).toBe(
      'Собери что угодно!',
    )
  })

  it('шпаргалка «Как управлять» — первой в разделе: тап, удержание, бросок, заряд, где «Хитрости»', () => {
    const cheats = host.querySelector('#sandbox-cheats')!
    const page = cheats.closest('.settings-page')!
    expect(page.querySelector('.settings-group')!.contains(cheats)).toBe(true)
    const items = [...cheats.querySelectorAll('li')].map((li) => li.textContent ?? '')
    expect(items.length).toBeGreaterThanOrEqual(5)
    const all = items.join(' ')
    for (const word of ['Нажать', 'Подержать', 'Смахнуть', 'Зарядить', '«Хитрости»']) expect(all).toContain(word)
  })

  it('«Физика как в жизни» выключена по умолчанию и сохраняется', () => {
    const real = host.querySelector<HTMLInputElement>('#sandbox-real')!
    expect(real.checked).toBe(false)
    real.checked = true
    real.dispatchEvent(new Event('change'))
    expect(loadSettings().sandboxRealPhysics).toBe(true)
  })

  it('сколько деталей на экране: 20 / 40 / 60, по умолчанию 40', () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('#sandbox-max button')]
    expect(buttons.map((b) => b.dataset.max)).toEqual(['20', '40', '60'])
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true')
    buttons[2]!.click()
    expect(loadSettings().sandboxMaxPieces).toBe(60)
  })

  it('«Детали в руке встают ровно» включено по умолчанию', () => {
    const straight = host.querySelector<HTMLInputElement>('#sandbox-straight')!
    expect(straight.checked).toBe(true)
    straight.checked = false
    straight.dispatchEvent(new Event('change'))
    expect(loadSettings().sandboxAutoStraight).toBe(false)
  })

  it('«Липучка» включена по умолчанию и сохраняется', () => {
    const sticky = host.querySelector<HTMLInputElement>('#sandbox-sticky')!
    expect(sticky.checked).toBe(true)
    sticky.checked = false
    sticky.dispatchEvent(new Event('change'))
    expect(loadSettings().sandboxSticky).toBe(false)
  })

  it('размер деталей: крупные / средние / мелкие, по умолчанию средние', () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('#sandbox-size button')]
    expect(buttons.map((b) => b.textContent)).toEqual(['Крупные', 'Средние', 'Мелкие'])
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true')
    buttons[2]!.click()
    expect(loadSettings().sandboxPieceSize).toBe('tiny')
    buttons[0]!.click()
    expect(loadSettings().sandboxPieceSize).toBe('big')
  })

  it('какие детали в шкафу: галочки, снятая — прячется; подушки нет', () => {
    const boxes = [...host.querySelectorAll<HTMLInputElement>('#sandbox-kinds input[type="checkbox"]')]
    expect(boxes).toHaveLength(36)
    expect(host.querySelector('#sandbox-kind-pillow')).toBeNull()
    expect(host.querySelector('#sandbox-kind-fan')).not.toBeNull()
    expect(host.querySelector('#sandbox-kind-cannon')).not.toBeNull()
    expect(boxes.every((b) => b.checked)).toBe(true)
    const stone = host.querySelector<HTMLInputElement>('#sandbox-kinds input[data-kind="stone"]')!
    stone.checked = false
    stone.dispatchEvent(new Event('change'))
    expect(loadSettings().sandboxHiddenKinds).toEqual(['stone'])
    stone.checked = true
    stone.dispatchEvent(new Event('change'))
    expect(loadSettings().sandboxHiddenKinds).toEqual([])
  })

  it('«Убрать все фото построек» — только после подтверждения', async () => {
    host.querySelector<HTMLButtonElement>('#sandbox-clear-photos')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="no"]')!.click()
    await Promise.resolve()
    expect(clearSandboxPhotos).not.toHaveBeenCalled()
    host.querySelector<HTMLButtonElement>('#sandbox-clear-photos')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="yes"]')!.click()
    await vi.waitFor(() => expect(clearSandboxPhotos).toHaveBeenCalledTimes(1))
  })

  it('звёздочек у песочницы нет; сброс звёздочек пазла на месте', () => {
    expect(host.querySelector('#shape-build-reset-stars')).toBeNull()
    expect(host.querySelector('#shape-build-outline')).toBeNull()
    stored.set(GALLERY_STAR_KEYS.puzzle, JSON.stringify(['farm']))
    host.querySelector<HTMLButtonElement>('#puzzle-reset-stars')!.click()
    host.querySelector<HTMLButtonElement>('[data-choice="yes"]')!.click()
    return vi.waitFor(() => expect(stored.has(GALLERY_STAR_KEYS.puzzle)).toBe(false))
  })

  it('«Сбросить настройки» возвращает умолчания песочницы', () => {
    host.querySelector<HTMLButtonElement>('#sandbox-max [data-max="20"]')!.click()
    const real = host.querySelector<HTMLInputElement>('#sandbox-real')!
    real.checked = true
    real.dispatchEvent(new Event('change'))
    const stone = host.querySelector<HTMLInputElement>('#sandbox-kinds input[data-kind="stone"]')!
    stone.checked = false
    stone.dispatchEvent(new Event('change'))
    const reset = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === 'Сбросить настройки',
    )!
    const sticky = host.querySelector<HTMLInputElement>('#sandbox-sticky')!
    sticky.checked = false
    sticky.dispatchEvent(new Event('change'))
    host.querySelector<HTMLButtonElement>('#sandbox-size [data-size="tiny"]')!.click()
    reset.click()
    expect(host.querySelector('#sandbox-max [data-max="40"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(host.querySelector('#sandbox-size [data-size="small"]')!.getAttribute('aria-pressed')).toBe('true')
    expect(real.checked).toBe(false)
    expect(sticky.checked).toBe(true)
    expect(stone.checked).toBe(true)
  })
})
