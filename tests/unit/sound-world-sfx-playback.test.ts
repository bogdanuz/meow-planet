import { describe, expect, it } from 'vitest'
import {
  SOUND_WORLD_SFX_LEVEL,
  SOUND_WORLD_SFX_PLAYBACK,
} from '../../src/games/sound-world/sfx-playback'

describe('sound-world sfx playback clips', () => {
  it('обрезка для владельских Pixabay-клипов', () => {
    for (const id of [
      'ambulance',
      'police-car',
      'lion',
      'bear',
      'whale',
      'rooster',
      'duck',
      'owl',
      'seal',
      'hen',
      'goose',
      'wolf',
      'car',
      'helicopter',
      'drum',
      'piano',
      'ship',
      'train',
    ] as const) {
      const clip = SOUND_WORLD_SFX_PLAYBACK[id]
      expect(clip?.durationSec).toBeGreaterThan(0.5)
      expect(clip?.durationSec).toBeLessThanOrEqual(8)
    }
    expect(SOUND_WORLD_SFX_PLAYBACK.ambulance?.durationSec).toBeGreaterThanOrEqual(3.3)
    expect(SOUND_WORLD_SFX_PLAYBACK.car?.durationSec).toBeGreaterThanOrEqual(3.3)
    expect(SOUND_WORLD_SFX_PLAYBACK['police-car']?.repeat).toBe(3)
    const volumes = Object.values(SOUND_WORLD_SFX_PLAYBACK).map((c) => c?.volume)
    expect(new Set(volumes)).toEqual(new Set([SOUND_WORLD_SFX_LEVEL]))
  })
})
