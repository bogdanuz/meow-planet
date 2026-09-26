import { describe, expect, it } from 'vitest'
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
    allowBrightMotion: () => true,
    updateSettings: () => undefined,
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
    expect(host.querySelector('#quiet-mode')).toBeNull()
    expect(host.querySelector('input[name="counting-limit"]')).toBeNull()
  })

  it('«Об играх» — карточки с подзаголовками из документа', () => {
    const host = document.createElement('div')
    renderAboutGamesPanel(host)
    expect(host.querySelectorAll('.parent-about__item')).toHaveLength(9)
    expect(host.textContent).toContain('Что происходит для ребёнка')
    expect(host.textContent).toContain('Как играть вместе')
    expect(host.textContent).toContain('Продолжение без экрана')
  })
})
