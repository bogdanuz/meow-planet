import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import { FREE_FIELD_COUNT } from '../../src/games/balloon-pop/logic'
import {
  FREE_LAYOUT_SCALE_MIN,
  FREE_MODE_VISUAL_SCALE,
  layoutBalloonPositions,
  layoutBalloonsForField,
} from '../../src/games/balloon-pop/layout'
import type { BalloonSize } from '../../src/games/balloon-pop/logic'

function guardRadius(
  size: BalloonSize,
  layoutScale: number,
  profile: 'free' | 'task',
): number {
  const base = profile === 'free' ? (size === 'lg' ? 17 : 8.5) : size === 'lg' ? 21 : 10.5
  const gap = profile === 'free' ? 2.2 : 3.5
  const freeMul = profile === 'free' ? FREE_MODE_VISUAL_SCALE : 1
  return base * layoutScale * freeMul + gap
}

function pseudoFreeField(count: number, rng: () => number): { id: string; size: BalloonSize }[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `b-${i}`,
    size: (rng() < 0.42 ? 'lg' : 'sm') as BalloonSize,
  }))
}

function assertNoOverlap(
  balloons: { id: string; size: BalloonSize }[],
  plan: ReturnType<typeof layoutBalloonsForField>,
  profile: 'free' | 'task',
): void {
  const entries = balloons.map((b) => ({
    size: b.size,
    pos: plan.placementsById.get(b.id)!,
    r: guardRadius(b.size, plan.layoutScale, profile),
  }))
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const dx = (entries[i]!.pos.xPct - entries[j]!.pos.xPct) * 1.45
      const dy = entries[i]!.pos.yPct - entries[j]!.pos.yPct
      const d = Math.hypot(dx, dy)
      expect(d).toBeGreaterThanOrEqual(entries[i]!.r + entries[j]!.r - 1.1)
    }
  }
}

describe('balloon-pop layout', () => {
  it('свобода: scale не ниже минимума (шары не «точки»)', () => {
    const rng = createSeededRandom(42)
    const balloons = pseudoFreeField(FREE_FIELD_COUNT, rng)
    const plan = layoutBalloonsForField(balloons, createSeededRandom(7), {
      fieldProfile: 'free',
    })
    expect(plan.layoutScale).toBeGreaterThanOrEqual(FREE_LAYOUT_SCALE_MIN - 0.02)
    expect(plan.placementsById.size).toBe(FREE_FIELD_COUNT)
  })

  it('свобода: 8 шаров с охранными полями', () => {
    for (let seed = 0; seed < 16; seed += 1) {
      const rng = createSeededRandom(seed)
      const balloons = pseudoFreeField(FREE_FIELD_COUNT, rng)
      const plan = layoutBalloonsForField(balloons, createSeededRandom(seed + 100), {
        fieldProfile: 'free',
      })
      expect(plan.placementsById.size).toBe(FREE_FIELD_COUNT)
      assertNoOverlap(balloons, plan, 'free')
    }
  })

  it('свобода: координаты разбросаны (не одна колонка)', () => {
    const balloons = pseudoFreeField(FREE_FIELD_COUNT, createSeededRandom(1))
    const plan = layoutBalloonsForField(balloons, createSeededRandom(99), {
      fieldProfile: 'free',
    })
    const xs = [...plan.placementsById.values()].map((p) => p.xPct)
    const ys = [...plan.placementsById.values()].map((p) => p.yPct)
    expect(new Set(xs.map((x) => Math.round(x / 5))).size).toBeGreaterThanOrEqual(4)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(18)
  })

  it('задание: 5 шаров при modeScale 1.25', () => {
    const balloons = pseudoFreeField(5, createSeededRandom(3))
    const plan = layoutBalloonsForField(balloons, createSeededRandom(3), {
      modeScale: 1.25,
      fieldProfile: 'task',
    })
    expect(plan.placementsById.size).toBe(5)
    assertNoOverlap(balloons, plan, 'task')
  })

  it('центры не в зоне Мяу/реплики', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const pts = layoutBalloonPositions(FREE_FIELD_COUNT, createSeededRandom(seed))
      for (const p of pts) {
        expect(p.xPct <= 28 && p.yPct >= 72).toBe(false)
      }
    }
  })

  it('свобода: шары по всему небу, без столбика и кучи', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const pts = layoutBalloonPositions(FREE_FIELD_COUNT, createSeededRandom(seed))
      const xs = pts.map((p) => p.xPct)
      const ys = pts.map((p) => p.yPct)
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(48)
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(28)
      const xBands = [0, 1, 2, 3].map(
        (band) => xs.filter((x) => x >= 14 + band * 20 && x < 14 + (band + 1) * 20).length,
      )
      expect(xBands.filter((n) => n > 0).length).toBeGreaterThanOrEqual(4)
      let stacked = 0
      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const dx = Math.abs(pts[i]!.xPct - pts[j]!.xPct)
          const dy = Math.abs(pts[i]!.yPct - pts[j]!.yPct)
          if (dx < 8 && dy < 14) stacked += 1
        }
      }
      expect(stacked).toBe(0)
    }
  })
})
