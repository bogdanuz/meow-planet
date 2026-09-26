import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import { resolveMatchDrop } from '../../src/shared/placement'
import { FIELD_COLORS as BALLOON_FIELD_COLORS } from '../../src/shared/field-colors'
import {
  BASKET_ICON_SHAPE,
  createBaskets,
  createBeads,
  evaluateSortDrop,
  isCanonicalToy,
  SHAPE_TO_COLOR,
  SORT_COLORS,
  sortBasketLabelRu,
  sortToyLabelRu,
} from '../../src/games/sort-colors/logic'
import { pickSortDropPraise } from '../../src/games/sort-colors/praise'

describe('placement + sort-colors logic', () => {
  it('resolveMatchDrop: совпадение и soft-error', () => {
    expect(resolveMatchDrop('red', 'red', 'hint')).toEqual({ ok: true })
    expect(resolveMatchDrop('red', 'orange', 'В красную')).toEqual({
      ok: false,
      soft: true,
      message: 'В красную',
    })
  })

  it('5 корзинок, 10 игрушек — форма+цвет 1:1', () => {
    expect(SORT_COLORS).toEqual(BALLOON_FIELD_COLORS)
    const baskets = createBaskets()
    expect(baskets).toHaveLength(5)
    for (const b of baskets) {
      expect(b.shape).toBe(BASKET_ICON_SHAPE[b.color])
      expect(SHAPE_TO_COLOR[b.shape]).toBe(b.color)
    }

    const beads = createBeads(createSeededRandom(5))
    expect(beads).toHaveLength(10)
    for (const color of SORT_COLORS) {
      const group = beads.filter((b) => b.color === color)
      expect(group).toHaveLength(2)
      expect(group.every((b) => b.shape === BASKET_ICON_SHAPE[color])).toBe(true)
      expect(isCanonicalToy(color, group[0]!.shape)).toBe(true)
    }
  })

  it('sortToyLabelRu для aria', () => {
    expect(sortToyLabelRu('red', 'circle')).toBe('красный мячик')
    expect(sortToyLabelRu('green', 'heart')).toBe('зелёное сердечко')
    expect(sortToyLabelRu('violet', 'star')).toBe('фиолетовая звёздочка')
  })

  it('sortBasketLabelRu — подпись фигурой', () => {
    expect(sortBasketLabelRu('circle')).toBe('Мячик')
    expect(sortBasketLabelRu('heart')).toBe('Сердечко')
    expect(sortBasketLabelRu('star')).toBe('Звёздочка')
  })

  it('evaluateSortDrop по форме', () => {
    expect(evaluateSortDrop('circle', 'circle').ok).toBe(true)
    const wrong = evaluateSortDrop('circle', 'square')
    expect(wrong.ok).toBe(false)
    if (!wrong.ok) expect(wrong.message).toMatch(/мячик/i)
  })

  it('похвала шага без корзины', () => {
    const msg = pickSortDropPraise(createSeededRandom(2))
    expect(msg).toMatch(/^(Отлично|Здорово|Ура|Класс)!$/)
  })
})
