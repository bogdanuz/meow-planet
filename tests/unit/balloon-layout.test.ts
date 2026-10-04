import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import {
  balloonMatchesTask,
  createFieldForTask,
  createFreeField,
  FREE_FIELD_COUNT,
  pickOptionalTask,
} from '../../src/games/balloon-pop/logic'
import {
  BALLOON_SIZE_BOOST,
  balloonGuardRadius,
  FIT_MIN_COUNT,
  FREE_MODE_VISUAL_SCALE,
  KEEP_SIZE_SCALE_MIN,
  fitBalloonsToField,
  layoutBalloonPositions,
  layoutBalloonsForField,
} from '../../src/games/balloon-pop/layout'
import type { BalloonSize } from '../../src/games/balloon-pop/logic'

function guardRadius(
  size: BalloonSize,
  layoutScale: number,
  modeScale: number,
  profile: 'free' | 'task',
): number {
  const gap = profile === 'free' ? 2.2 : 3.5
  const freeMul = profile === 'free' ? FREE_MODE_VISUAL_SCALE : 1
  return balloonGuardRadius(size, profile) * layoutScale * modeScale * freeMul + gap
}

function pseudoFreeField(count: number, rng: () => number): { id: string; size: BalloonSize }[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `b-${i}`,
    size: (rng() < 0.42 ? 'lg' : 'sm') as BalloonSize,
  }))
}

function assertNoOverlap(
  balloons: readonly { id: string; size: BalloonSize }[],
  plan: ReturnType<typeof layoutBalloonsForField>,
  profile: 'free' | 'task',
): void {
  const entries = balloons.map((b) => ({
    pos: plan.placementsById.get(b.id)!,
    r: guardRadius(b.size, plan.layoutScale, plan.modeScale, profile),
  }))
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const dx = (entries[i]!.pos.xPct - entries[j]!.pos.xPct) * 1.45
      const dy = entries[i]!.pos.yPct - entries[j]!.pos.yPct
      expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(entries[i]!.r + entries[j]!.r - 1.1)
    }
  }
}

describe('balloon-pop layout', () => {
  it('большой шарик ×1,5, маленький ×1,1 от прежних размеров', () => {
    expect(BALLOON_SIZE_BOOST).toEqual({ sm: 1.1, lg: 1.5 })
  })

  it('CSS: большой примерно вдвое больше маленького на любом iPad (≥1,9)', () => {
    const css = readFileSync(path.join('src', 'games', 'balloon-pop', 'balloon-pop.css'), 'utf8')
    const pick = (size: 'sm' | 'lg') => {
      const block = css.match(
        new RegExp(`\\.balloon-pop__balloon--${size} \\.balloon-pop__balloon-art \\{([^}]*)\\}`),
      )![1]!
      const [w, h] = [...block.matchAll(/min\(([\d.]+)cq[wh], ([\d.]+)rem\)/g)].map((m) => ({
        cq: Number(m[1]),
        rem: Number(m[2]),
      }))
      return { w: w!, h: h! }
    }
    const sm = pick('sm')
    const lg = pick('lg')
    const px = (v: { cq: number; rem: number }, field: number) =>
      Math.min((v.cq / 100) * field, v.rem * 16)
    // Поле игры на iPad mini, iPad 10, Pro 11, Pro 13 (без верхней панели).
    for (const [fw, fh] of [
      [1133, 650],
      [1180, 726],
      [1194, 740],
      [1366, 930],
    ] as const) {
      expect(px(lg.w, fw) / px(sm.w, fw), `${fw}w`).toBeGreaterThanOrEqual(1.9)
      expect(px(lg.h, fh) / px(sm.h, fh), `${fh}h`).toBeGreaterThanOrEqual(1.9)
    }
  })

  it('свобода: если крупные не помещаются — меньше шариков, а не мельче', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const field = createFreeField(createSeededRandom(seed))
      expect(field).toHaveLength(FREE_FIELD_COUNT)
      const { plan, kept } = fitBalloonsToField(field, createSeededRandom(seed + 50), {
        fieldProfile: 'free',
      })
      expect(kept.length).toBeGreaterThanOrEqual(FIT_MIN_COUNT.free)
      expect(kept.length).toBeLessThanOrEqual(FREE_FIELD_COUNT)
      if (kept.length > FIT_MIN_COUNT.free) {
        expect(plan.layoutScale).toBeGreaterThanOrEqual(KEEP_SIZE_SCALE_MIN)
      }
      expect(kept.some((b) => b.size === 'lg')).toBe(true)
      expect(kept.some((b) => b.size === 'sm')).toBe(true)
      expect(plan.placementsById.size).toBe(kept.length)
      assertNoOverlap(kept, plan, 'free')
    }
  })

  it('задание: цели задания никогда не убираются', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const task = pickOptionalTask(createSeededRandom(seed))
      const field = createFieldForTask(task, createSeededRandom(seed + 1))
      const targets = field.filter((b) => balloonMatchesTask(b, task))
      const { plan, kept } = fitBalloonsToField(field, createSeededRandom(seed + 2), {
        fieldProfile: 'task',
        modeScale: 1.25,
        isRequired: (b) => balloonMatchesTask(b, task),
      })
      for (const target of targets) expect(kept).toContain(target)
      expect(kept.length).toBeGreaterThanOrEqual(Math.min(field.length, FIT_MIN_COUNT.task))
      assertNoOverlap(kept, plan, 'task')
    }
  })

  it('задание: хотя бы один «не тот» шарик остаётся, даже если места нет', () => {
    const field = Array.from({ length: 8 }, (_, i) => ({
      id: `b-${i}`,
      size: 'lg' as BalloonSize,
      target: i < 3,
    }))
    const { kept } = fitBalloonsToField(field, createSeededRandom(4), {
      fieldProfile: 'task',
      modeScale: 3,
      isRequired: (b) => b.target,
    })
    expect(kept.filter((b) => b.target)).toHaveLength(3)
    expect(kept.some((b) => !b.target)).toBe(true)
  })

  it('свобода: координаты разбросаны (не одна колонка)', () => {
    const balloons = pseudoFreeField(6, createSeededRandom(1))
    const plan = layoutBalloonsForField(balloons, createSeededRandom(99), {
      fieldProfile: 'free',
    })
    const xs = [...plan.placementsById.values()].map((p) => p.xPct)
    const ys = [...plan.placementsById.values()].map((p) => p.yPct)
    expect(new Set(xs.map((x) => Math.round(x / 5))).size).toBeGreaterThanOrEqual(4)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(18)
  })

  it('центры не в зоне Мяу/реплики', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const pts = layoutBalloonPositions(FREE_FIELD_COUNT, createSeededRandom(seed))
      for (const p of pts) {
        expect(p.xPct <= 28 && p.yPct >= 72).toBe(false)
      }
    }
  })
})
