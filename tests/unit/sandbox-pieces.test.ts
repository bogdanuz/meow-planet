import { describe, expect, it } from 'vitest'
import {
  BLOCK_KINDS,
  BUCKET_PARTS,
  ITEM_KINDS,
  ITEM_MAX_PER_KIND,
  PIECE_KINDS,
  getPieceSpec,
  isPieceKind,
  pieceColor,
  tapAction,
} from '../../src/games/shape-build/pieces'

describe('тап по детали — её действие, меню — по удержанию (решение владельца 02.10.2026)', () => {
  it('кнопка жмётся, пушка/толкатель/ракета/ножницы/катапульта срабатывают', () => {
    expect(tapAction('button')).toBe('press')
    for (const kind of ['cannon', 'pusher', 'rocket', 'scissors', 'launcher'] as const) {
      expect(tapAction(kind), kind).toBe('fire')
    }
  })

  it('лампочка, ворота, люк, тележка, лента, вентилятор, подъёмник — вкл ↔ выкл', () => {
    for (const kind of ['lamp', 'gate', 'trapdoor', 'cart', 'conveyor', 'fan', 'lift'] as const) {
      expect(tapAction(kind), kind).toBe('toggle')
    }
  })

  it('шарик лопается, Мяу и Олли здороваются, простые детали открывают меню', () => {
    expect(tapAction('balloon')).toBe('pop')
    expect(tapAction('meow')).toBe('greet')
    expect(tapAction('olli')).toBe('greet')
    for (const kind of ['cube', 'plank', 'ball', 'stone', 'seesaw', 'pulley', 'mill', 'shelf', 'hoop'] as const) {
      expect(tapAction(kind), kind).toBe('menu')
    }
  })

  it('у каждой детали из шкафа своё действие по тапу', () => {
    for (const kind of PIECE_KINDS) expect(['press', 'fire', 'toggle', 'pop', 'greet', 'menu']).toContain(tapAction(kind))
  })
})

function polygonArea(points: readonly { x: number; y: number }[]): number {
  let sum = 0
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    sum += p.x * q.y - q.x * p.y
  })
  return Math.abs(sum) / 2
}

function isConvex(points: readonly { x: number; y: number }[]): boolean {
  let sign = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    const c = points[(i + 2) % points.length]!
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (Math.abs(cross) < 1e-9) continue
    const s = Math.sign(cross)
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}

describe('каталог деталей песочницы', () => {
  it('деревянные детали и предметы — как решил владелец (2.1–2.2; переработка: полка, жёлоб, труба, люк, ножницы, катапульта)', () => {
    expect(BLOCK_KINDS).toEqual(['cube', 'brick', 'plank', 'triangle', 'dome', 'arch', 'column', 'ramp'])
    expect(ITEM_KINDS).toEqual([
      'ball', 'stone', 'balloon', 'cart', 'meow', 'olli', 'spring', 'wrecking', 'hoop', 'fan',
      'seesaw', 'conveyor', 'mill', 'lift', 'cannon',
      'pin', 'pulley', 'rocket', 'button', 'gate', 'pusher', 'lamp',
      'shelf', 'chute', 'pipe', 'trapdoor', 'scissors', 'launcher', 'bucket',
    ])
    expect(PIECE_KINDS).toEqual([...BLOCK_KINDS, ...ITEM_KINDS])
    expect(ITEM_MAX_PER_KIND).toBe(6)
    expect(isPieceKind('pillow')).toBe(false)
  })

  it('как поворачивается: кубики — на 90°, горка и кольцо — зеркально, круглые — никак', () => {
    expect(getPieceSpec('cube').turn).toBe('quarter')
    expect(getPieceSpec('fan').turn).toBe('quarter')
    expect(getPieceSpec('ramp').turn).toBe('flip')
    expect(getPieceSpec('hoop').turn).toBe('flip')
    for (const kind of ['ball', 'balloon', 'wrecking'] as const) expect(getPieceSpec(kind).turn).toBe('none')
  })

  it('горка — длинный пологий склон', () => {
    const ramp = getPieceSpec('ramp')
    expect(ramp.w / ramp.h).toBeGreaterThanOrEqual(2.5)
    expect(ramp.material).toBe('wood')
  })

  it('шар-таран тяжёлый и висит на верёвке; кольцо висит на стене; вентилятор дует', () => {
    const wrecking = getPieceSpec('wrecking')
    expect(wrecking.rope).toBe(true)
    expect(wrecking.body.density).toBeGreaterThan(getPieceSpec('cube').body.density * 2)
    expect(getPieceSpec('hoop').fixed).toBe(true)
    expect(getPieceSpec('cube').fixed ?? false).toBe(false)
    const fan = getPieceSpec('fan')
    expect(fan.wind?.length).toBeGreaterThan(4)
    expect(fan.wind?.force).toBeGreaterThan(0)
  })

  it('у каждой детали подпись, материал и выпуклые части с площадью', () => {
    for (const kind of PIECE_KINDS) {
      const spec = getPieceSpec(kind)
      expect(spec.kind).toBe(kind)
      expect(spec.titleRu.length).toBeGreaterThan(1)
      expect(spec.parts.length).toBeGreaterThan(0)
      for (const part of [...spec.parts, ...(spec.link?.parts ?? []), ...(spec.pulley ? BUCKET_PARTS : [])]) {
        if (part.type === 'circle') {
          expect(part.r).toBeGreaterThan(0.1)
        } else {
          expect(part.points.length).toBeGreaterThanOrEqual(3)
          expect(part.points.length).toBeLessThanOrEqual(8)
          expect(polygonArea(part.points)).toBeGreaterThan(0.01)
          expect(isConvex(part.points)).toBe(true)
        }
      }
    }
  })

  it('деревянные — группа block, предметы — item', () => {
    for (const kind of BLOCK_KINDS) expect(getPieceSpec(kind).group).toBe('block')
    for (const kind of ITEM_KINDS) expect(getPieceSpec(kind).group).toBe('item')
  })

  it('камень тяжелее кубика, шарик намного легче', () => {
    const density = (kind: Parameters<typeof getPieceSpec>[0]) => getPieceSpec(kind).body.density
    expect(density('stone')).toBeGreaterThan(density('cube') * 2)
    expect(density('balloon')).toBeLessThan(density('cube') / 4)
  })

  it('мячик прыгучий, камень — нет; шарик тянет вверх', () => {
    expect(getPieceSpec('ball').body.restitution).toBeGreaterThan(0.6)
    expect(getPieceSpec('stone').body.restitution).toBeLessThan(0.1)
    expect(getPieceSpec('balloon').lift).toBeGreaterThan(0)
    expect(getPieceSpec('cube').lift ?? 0).toBe(0)
  })

  it('у тележки два колеса, у батута пружинящий верх', () => {
    expect(getPieceSpec('cart').wheels).toHaveLength(2)
    expect(getPieceSpec('spring').bounce).toBeGreaterThan(0)
  })

  it('доска длинная — для качелей и катапульты', () => {
    const plank = getPieceSpec('plank')
    expect(plank.w / plank.h).toBeGreaterThan(6)
  })

  it('isPieceKind отсекает чужое', () => {
    expect(isPieceKind('cube')).toBe(true)
    expect(isPieceKind('house')).toBe(false)
    expect(isPieceKind('')).toBe(false)
  })

  it('цвет деревянной детали по кругу из палитры, у предметов свой', () => {
    const a = pieceColor('cube', 0)
    const b = pieceColor('cube', 1)
    expect(a).toMatch(/^#[0-9a-f]{6}$/i)
    expect(a).not.toBe(b)
    expect(pieceColor('stone', 0)).toBe(pieceColor('stone', 5))
  })
})
