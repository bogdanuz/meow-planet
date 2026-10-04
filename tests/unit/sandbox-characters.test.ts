import { describe, expect, it } from 'vitest'
import { CHAR_POSES, charPose, greetOffset, type CharState } from '../../src/games/shape-build/characters'

const calm: CharState = {
  vx: 0,
  vy: 0,
  held: false,
  tied: false,
  onRocket: false,
  inCannon: false,
  chute: false,
  zeroG: false,
  idleS: 0,
  sinceGreet: null,
  sinceRide: null,
  now: 1,
}

describe('Мяу и Олли — живые позы (решение владельца 02.10.2026)', () => {
  it('спокойно стоит как мягкая игрушка анфас и иногда моргает', () => {
    expect(charPose(calm)).toBe('plush')
    const blinks = Array.from({ length: 400 }, (_, i) => charPose({ ...calm, now: i * 0.02 })).filter((p) => p === 'blink')
    expect(blinks.length).toBeGreaterThan(0)
    expect(blinks.length).toBeLessThan(60)
  })

  it('тап: два-три шага, потом машет', () => {
    const steps = new Set([0.1, 0.35, 0.6].map((t) => charPose({ ...calm, sinceGreet: t })))
    expect(steps).toEqual(new Set(['walk1', 'walk2']))
    expect(charPose({ ...calm, sinceGreet: 1.2 })).toBe('wave')
    expect(charPose({ ...calm, sinceGreet: 3 })).toBe('plush')
    expect(greetOffset(0.3)).not.toBe(0)
    expect(greetOffset(2)).toBe(0)
  })

  it('в пальце или на шарике — висит, с ракетой — ракетный рюкзак, без гравитации — плавает', () => {
    expect(charPose({ ...calm, held: true })).toBe('hang')
    expect(charPose({ ...calm, tied: true })).toBe('hang')
    expect(charPose({ ...calm, onRocket: true })).toBe('jetpack')
    expect(charPose({ ...calm, onRocket: true, vy: -8 })).toBe('jetpack')
    expect(charPose({ ...calm, zeroG: true, vx: 3 })).toBe('float')
  })

  it('в пушке — выглядывает и радуется; на парашюте — держится за стропы', () => {
    expect(charPose({ ...calm, inCannon: true })).toBe('joy')
    expect(charPose({ ...calm, chute: true, vy: 6 })).toBe('hang')
  })

  it('прокатился: летит вверх с батута — радость; едет — сидит и держится', () => {
    expect(charPose({ ...calm, sinceRide: 0.3, vy: -6 })).toBe('joy')
    expect(charPose({ ...calm, sinceRide: 0.3, vx: 1.5 })).toBe('ride')
    expect(charPose({ ...calm, sinceRide: 5 })).toBe('plush')
  })

  it('быстро летит или падает — удивлён; долго никто не трогал — спит', () => {
    expect(charPose({ ...calm, vy: 7 })).toBe('fly')
    expect(charPose({ ...calm, vx: -6, vy: -2 })).toBe('fly')
    expect(charPose({ ...calm, idleS: 30 })).toBe('sleep')
    expect(charPose({ ...calm, idleS: 30, held: true })).toBe('hang')
  })

  it('у каждой позы есть картинка в списке', () => {
    expect(CHAR_POSES).toEqual(['plush', 'blink', 'walk1', 'walk2', 'joy', 'hang', 'ride', 'fly', 'float', 'sleep', 'wave', 'jetpack'])
  })
})
