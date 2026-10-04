import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/shared/puzzle-photos', () => ({ clearPuzzlePhotos: vi.fn(async () => undefined) }))
vi.mock('../../src/shared/sandbox-photos', () => ({ clearSandboxPhotos: vi.fn(async () => undefined) }))

import { renderSettingsForm } from '../../src/app/parent/settings-form'

const visiblePage = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLElement>('.settings-page')].filter((p) => !p.hidden).map((p) => p.dataset.section)

const pageOf = (host: HTMLElement, selector: string) =>
  host.querySelector(selector)?.closest<HTMLElement>('.settings-page')?.dataset.section

describe('настройки по разделам (как на iPad)', () => {
  let host: HTMLDivElement

  beforeEach(() => {
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
    host = document.createElement('div')
    document.body.append(host)
  })

  afterEach(() => {
    host.remove()
    vi.unstubAllGlobals()
  })

  it('слева «Общее» и выпущенные игры со своими пунктами; сначала открыто «Общее»', () => {
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0' })
    const nav = [...host.querySelectorAll<HTMLButtonElement>('.settings-nav__item')]
    expect(nav.map((b) => b.dataset.section)).toEqual([
      'general',
      'balloon-pop',
      'sound-world',
      'puzzle',
      'shape-build',
      'hide-seek',
      'counting',
    ])
    expect(nav.map((b) => b.textContent)).toEqual([
      'Общее',
      'Лопни шарик',
      'Изучаем звуки',
      'Собери пазл',
      'Собери что угодно!',
      'Прятки',
      'Учимся считать',
    ])
    expect(nav[0]!.getAttribute('aria-selected')).toBe('true')
    expect(visiblePage(host)).toEqual(['general'])
  })

  it('пункты стоят по смыслу: общее — в «Общем», игровые — в разделе своей игры', () => {
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0' })
    expect(pageOf(host, '#music-enabled')).toBe('general')
    expect(pageOf(host, '#sound-enabled')).toBe('general')
    expect(pageOf(host, '.settings-companion [data-companion]')).toBe('general')
    expect(pageOf(host, '#child-name')).toBe('general')
    expect(pageOf(host, '#balloon-tasks')).toBe('balloon-pop')
    expect(pageOf(host, '#hide-en')).toBe('sound-world')
    expect(pageOf(host, '#puzzle-pieces')).toBe('puzzle')
    expect(pageOf(host, '#puzzle-hint')).toBe('puzzle')
    expect(pageOf(host, '#puzzle-clear-photos')).toBe('puzzle')
    expect(pageOf(host, '#puzzle-reset-stars')).toBe('puzzle')
    expect(pageOf(host, '#sandbox-real')).toBe('shape-build')
    expect(pageOf(host, '#sandbox-max')).toBe('shape-build')
    expect(pageOf(host, '#sandbox-kinds')).toBe('shape-build')
    expect(pageOf(host, '#sandbox-clear-photos')).toBe('shape-build')
    expect(pageOf(host, '#hide-seek-level')).toBe('hide-seek')
    expect(pageOf(host, '#hide-seek-mirror')).toBe('hide-seek')
    expect(pageOf(host, '#hide-seek-hints')).toBe('hide-seek')
    expect(pageOf(host, '#hide-seek-reset-stars')).toBe('hide-seek')
  })

  it('тап по разделу слева показывает его справа', () => {
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0' })
    host.querySelector<HTMLButtonElement>('.settings-nav__item[data-section="puzzle"]')!.click()
    expect(visiblePage(host)).toEqual(['puzzle'])
    expect(
      host.querySelector('.settings-nav__item[data-section="puzzle"]')!.getAttribute('aria-selected'),
    ).toBe('true')
    expect(
      host.querySelector('.settings-nav__item[data-section="general"]')!.getAttribute('aria-selected'),
    ).toBe('false')
  })

  it('из игры открывается раздел этой игры; у игры без раздела — «Общее»', () => {
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'puzzle' })
    expect(visiblePage(host)).toEqual(['puzzle'])
    host.replaceChildren()
    renderSettingsForm(host, { onSaved: () => undefined, appVersion: '0.0.0', initialSection: 'drawing' })
    expect(visiblePage(host)).toEqual(['general'])
  })
})
