import { describe, expect, it } from 'vitest'
import {
  pendulumAtRest,
  pendulumImpulse,
  pendulumShouldRing,
  stepPendulum,
} from '../../src/games/sound-world/bell-pendulum'
import { DRUM_LAYERS, PIANO_KEY_SLOTS, MARACA_LAYERS } from '../../src/games/sound-world/instrument-layout'

describe('bell pendulum', () => {
  it('после толчка качается и звенит на пиках, потом замирает', () => {
    let p = pendulumImpulse({ angle: 0, vel: 0 })
    expect(Math.abs(p.vel)).toBeGreaterThan(1)
    let rings = 0
    let prevVel = p.vel
    for (let i = 0; i < 800; i += 1) {
      const next = stepPendulum(p, 0.016)
      if (pendulumShouldRing(prevVel, next)) rings += 1
      prevVel = next.vel
      p = next
    }
    expect(rings).toBeGreaterThan(3)
    expect(pendulumAtRest(p)).toBe(true)
  })
})

describe('instrument layout', () => {
  it('центр барабанов берёт прежний правый звук, правый — новый', () => {
    expect(DRUM_LAYERS.find((d) => d.piece === 'kick')?.sfxId).toBe('drum-tom')
    expect(DRUM_LAYERS.find((d) => d.piece === 'tom')?.sfxId).toBe('drum-right')
    expect(DRUM_LAYERS.find((d) => d.piece === 'snare')?.sfxId).toBe('drum-snare')
  })

  it('маракасы — два независимых слоя', () => {
    expect(MARACA_LAYERS).toHaveLength(2)
    expect(MARACA_LAYERS[0]?.file).toBe('maraca-left')
    expect(MARACA_LAYERS[1]?.file).toBe('maraca-right')
  })

  it('пианино — 7 слотов под отдельные клавиши', () => {
    expect(PIANO_KEY_SLOTS).toHaveLength(7)
    expect(PIANO_KEY_SLOTS[0]?.x).toBeLessThan(PIANO_KEY_SLOTS[6]!.x)
    expect(PIANO_KEY_SLOTS[0]?.w).toBeGreaterThan(0.05)
  })

  it('барабаны перекрываются как установка', () => {
    const kick = DRUM_LAYERS.find((d) => d.piece === 'kick')!
    const snare = DRUM_LAYERS.find((d) => d.piece === 'snare')!
    const tom = DRUM_LAYERS.find((d) => d.piece === 'tom')!
    expect(snare.left).toBe(0)
    expect(kick.width).toBeGreaterThan(snare.width)
    expect(kick.width).toBeGreaterThan(tom.width)
    expect(snare.left + snare.width).toBeGreaterThan(kick.left)
    expect(tom.left).toBeLessThan(kick.left + kick.width)
    expect(kick.z).toBeLessThan(snare.z)
  })
})
