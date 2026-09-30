import { describe, expect, it } from 'vitest'
import {
  gameMusicVolume,
  gameUsesSharedMusic,
  hubSoundUrl,
} from '../../src/shared/hub-sounds'

describe('hub-sounds game music', () => {
  it('общая петля для игр кроме «В гостях» и «Рисовалки»', () => {
    expect(gameUsesSharedMusic('balloon-pop')).toBe(true)
    expect(gameUsesSharedMusic('sound-world')).toBe(true)
    expect(gameUsesSharedMusic('counting')).toBe(true)
    expect(gameUsesSharedMusic('drawing')).toBe(false)
    expect(gameUsesSharedMusic('meow-home')).toBe(false)
  })

  it('game-music.mp3 в каталоге audio', () => {
    expect(hubSoundUrl.gameMusic()).toContain('game-music.mp3')
  })

  it('фон тише в изучаем звуки и лопни шарик', () => {
    expect(gameMusicVolume('sound-world')).toBeCloseTo(0.04275, 4)
    expect(gameMusicVolume('balloon-pop')).toBeCloseTo(0.171, 4)
  })
})
