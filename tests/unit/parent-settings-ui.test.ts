import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { renderAboutGamesPanel } from '../../src/app/parent/about-games'
import { renderParentScreen } from '../../src/app/screens/parent'
import type { AudioManager } from '../../src/shared/audio'
import type { RouterController } from '../../src/app/router-controller'

function mockAudio(): AudioManager {
  return {
    unlock: async () => undefined,
    isUnlocked: () => true,
    playBeep: async () => undefined,
    playTone: async () => undefined,
    playUrl: async () => true,
    playUrlSegment: async () => true,
    stopMusic: () => undefined,
    fadeOutMusic: () => undefined,
    switchMusic: async () => true,
    waitUntilVoiceEnded: async () => undefined,
    stopSfx: () => undefined,
    stopVoice: () => undefined,
    allowBrightMotion: () => true,
    updateSettings: () => undefined,
    preload: async () => undefined,
    duckMusic: () => undefined,
    restoreMusic: () => undefined,
  }
}

describe('настройки', () => {
  it('открываются сразу, без капчи, с музыкой и эффектами', () => {
    const host = document.createElement('div')
    const router = {
      goHome: () => undefined,
      navigate: () => undefined,
      getRoute: () => ({ screen: 'parent' as const }),
    } as unknown as RouterController
    renderParentScreen(host, router, {
      audio: mockAudio(),
      appVersion: '0.16.0',
      onSettingsSaved: () => undefined,
    })
    expect(host.querySelector('.parent-gate')).toBeNull()
    expect(host.querySelector('[aria-label="Настройки"]')).not.toBeNull()
    expect(host.querySelector('#music-enabled')).not.toBeNull()
    expect(host.querySelector('#sound-enabled')).not.toBeNull()
    expect(host.querySelector('#child-name')).not.toBeNull()
    expect(host.querySelector('#coloring-drag')).toBeNull()
    expect(host.querySelector('#quiet-mode')).toBeNull()
    expect(host.querySelector('input[name="counting-limit"]')).toBeNull()
  })

  it('имя ребёнка сохраняется сразу при вводе — «Назад» с открытой клавиатурой его не теряет', () => {
    const host = document.createElement('div')
    const router = {
      goHome: () => undefined,
      navigate: () => undefined,
      getRoute: () => ({ screen: 'parent' as const }),
    } as unknown as RouterController
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    })
    onTestFinished(() => {
      vi.unstubAllGlobals()
    })
    const saved: string[] = []
    renderParentScreen(host, router, {
      audio: mockAudio(),
      appVersion: '0.16.0',
      onSettingsSaved: (next) => saved.push(next.childName),
    })
    const input = host.querySelector<HTMLInputElement>('#child-name')!
    input.value = 'Алиса'
    input.dispatchEvent(new Event('input'))
    expect(saved.at(-1)).toBe('Алиса')
  })

  it('«Об играх» — карточки с подзаголовками из документа', () => {
    const host = document.createElement('div')
    renderAboutGamesPanel(host)
    expect(host.querySelectorAll('.parent-about__item')).toHaveLength(9)
    expect(host.textContent).toContain('Что происходит для ребёнка')
    expect(host.textContent).toContain('Как играть вместе')
    expect(host.textContent).toContain('Продолжение без экрана')
  })

  it('«Об играх» не затирает класс панели — прокрутка остаётся', () => {
    const host = document.createElement('div')
    host.className = 'parent-about-host'
    renderAboutGamesPanel(host)
    expect(host.classList.contains('parent-about-host')).toBe(true)
    expect(host.querySelector(':scope > .parent-about')).not.toBeNull()
  })

  it('«Об играх» — названия из меню и строка о выборе помощника', () => {
    const host = document.createElement('div')
    renderAboutGamesPanel(host)
    const titles = [...host.querySelectorAll('.parent-about__title')].map((t) => t.textContent)
    expect(titles).toContain('Учимся считать')
    expect(titles).toContain('В гости')
    expect(titles).toContain('Изучаем звуки')
    const helper = host.querySelector('.parent-about__helper')
    expect(helper?.textContent).toContain('Мяу')
    expect(helper?.textContent).toContain('Олли')
    expect(helper?.textContent).toContain('Кто помогает в играх')
  })
})
