import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPieceSpec, PIECE_KINDS } from '../../src/games/shape-build/pieces'
import {
  BUCKET_SPRITE,
  SPRITE_NAMES,
  bodySprites,
  linkSprites,
  spriteBox,
  spriteTinted,
} from '../../src/games/shape-build/sprites'

describe('Собери что угодно! — рисунки деталей', () => {
  it('у каждой детали картинка целиком или по частям (корпус + подвижная часть)', () => {
    for (const kind of PIECE_KINDS) {
      const parts = bodySprites(kind)
      if (parts) {
        expect(SPRITE_NAMES).not.toContain(kind)
        for (const part of parts) expect(SPRITE_NAMES).toContain(part.name)
      } else {
        expect(SPRITE_NAMES).toContain(kind)
      }
      if (getPieceSpec(kind).link && kind !== 'cart') expect(linkSprites(kind) ?? bodySprites(kind)).not.toBeNull()
    }
    for (const name of ['cart-wheel', 'fan-blades', 'bucket', 'button-cap', 'pusher-glove', 'parachute', 'meow-jetpack', 'olli-jetpack'] as const) {
      expect(SPRITE_NAMES).toContain(name)
    }
  })

  it('каждая картинка лежит в public/ — попадает в офлайн-кэш', () => {
    for (const name of SPRITE_NAMES) {
      expect(existsSync(resolve(`public/assets/games/shape-build/pieces/${name}.png`)), name).toBe(true)
    }
  })

  it('стойки механизмов стоят на полу: низ картинки = низ детали', () => {
    for (const kind of ['seesaw', 'mill', 'lift', 'pusher', 'button', 'launcher'] as const) {
      const box = bodySprites(kind)![0]!.box
      expect(box.y + box.h, kind).toBeCloseTo(getPieceSpec(kind).h / 2, 1)
    }
    for (const kind of ['cannon', 'lamp', 'rocket', 'pin'] as const) {
      const box = spriteBox(kind)
      expect(box.y + box.h, kind).toBeCloseTo(getPieceSpec(kind).h / 2, 1)
    }
    expect(BUCKET_SPRITE.box.w).toBeGreaterThan(1.1)
  })

  it('дерево нарисовано строго сбоку: картинка ровно по форме физики — стыкуется без щелей', () => {
    for (const kind of ['cube', 'brick', 'triangle', 'dome', 'arch', 'column', 'ramp', 'plank'] as const) {
      const spec = getPieceSpec(kind)
      const box = spriteBox(kind)
      expect(box.x).toBeCloseTo(-spec.w / 2)
      expect(box.y).toBeCloseTo(-spec.h / 2)
      expect(box.w).toBeCloseTo(spec.w)
      expect(box.h).toBeCloseTo(spec.h)
    }
  })

  it('узелок шарика и петля шара-тарана выходят за круг, круг совпадает с физикой', () => {
    const balloon = spriteBox('balloon')
    expect(balloon.y).toBeCloseTo(-0.6)
    expect(balloon.w).toBeCloseTo(1.2)
    expect(balloon.y + balloon.h).toBeGreaterThan(0.7)
    const wrecking = spriteBox('wrecking')
    expect(wrecking.y + wrecking.h).toBeCloseTo(0.7)
    expect(wrecking.y).toBeLessThan(-0.75)
  })

  it('Мяу и Олли стоят на полу без растяжения', () => {
    for (const kind of ['meow', 'olli'] as const) {
      const box = spriteBox(kind)
      expect(box.y + box.h).toBeCloseTo(getPieceSpec(kind).h / 2)
      expect(box.w).toBeLessThanOrEqual(getPieceSpec(kind).w)
    }
  })

  it('ворота-рольставня: короб сверху; подъёмник без лестницы — низкое основание', () => {
    const box = bodySprites('gate')![0]!
    expect(box.name).toBe('gate-box')
    expect(box.box.y).toBeCloseTo(-getPieceSpec('gate').h / 2)
    expect(bodySprites('lift')![0]!.name).toBe('lift-base')
    expect(SPRITE_NAMES).not.toContain('lift-stand')
    expect(SPRITE_NAMES).not.toContain('gate-post')
    for (const kind of ['shelf', 'chute', 'trapdoor'] as const) {
      expect(bodySprites(kind)!.every((part) => part.name === 'plank'), kind).toBe(true)
    }
    expect(SPRITE_NAMES).toContain('scissors')
    expect(SPRITE_NAMES).toContain('pipe')
  })

  it('перекрашиваются только деревянные детали, шарик и труба (цвет пары), предметы — своими цветами', () => {
    expect(spriteTinted('cube')).toBe(true)
    expect(spriteTinted('plank')).toBe(true)
    expect(spriteTinted('balloon')).toBe(true)
    expect(spriteTinted('pipe')).toBe(true)
    for (const kind of ['ball', 'stone', 'cart', 'meow', 'olli', 'spring', 'wrecking', 'hoop', 'fan'] as const) {
      expect(spriteTinted(kind)).toBe(false)
    }
  })
})
