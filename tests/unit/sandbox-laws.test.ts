import { describe, expect, it } from 'vitest'
import { PIECE_LAWS } from '../../src/games/shape-build/laws'
import { SHELF_KINDS } from '../../src/games/shape-build/pieces'

describe('«Детали и законы»', () => {
  it('у каждой детали из шкафа есть карточка закона', () => {
    const covered = new Set(PIECE_LAWS.flatMap((entry) => entry.kinds))
    expect(SHELF_KINDS.filter((kind) => !covered.has(kind))).toEqual([])
  })

  it('в каждой карточке: закон, объяснение, что сказать ребёнку и что попробовать дома', () => {
    for (const entry of PIECE_LAWS) {
      expect(entry.title.length, entry.title).toBeGreaterThan(0)
      expect(entry.law.length, entry.title).toBeGreaterThan(0)
      expect(entry.text.length, entry.title).toBeGreaterThan(20)
      expect(entry.say, entry.title).toMatch(/^«.+»\.?$/)
      expect(entry.try.length, entry.title).toBeGreaterThan(10)
    }
  })

  it('без обещаний «развивает» и без неверного «тяжёлое падает быстрее»', () => {
    for (const entry of PIECE_LAWS) {
      const all = `${entry.text} ${entry.say} ${entry.try}`
      expect(all, entry.title).not.toMatch(/развива/i)
      expect(all, entry.title).not.toMatch(/тяжёл\S* пада\S* быстрее/i)
    }
  })
})
