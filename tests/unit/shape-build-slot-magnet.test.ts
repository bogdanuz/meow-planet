import { describe, expect, it } from 'vitest'
import { findSlotHitForShapePiece } from '../../src/games/shape-build/slot-magnet'

describe('shape-build slot magnet', () => {
  it('выбирает слот с максимальным пересечением той же формы', () => {
    const filled = new Set<string>()
    const hit = findSlotHitForShapePiece(
      { left: 90, top: 90, right: 130, bottom: 130, width: 40, height: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
      [
        {
          id: 'a',
          shape: 'circle',
          color: 'red',
          rect: { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40 },
        },
        {
          id: 'b',
          shape: 'square',
          color: 'blue',
          rect: { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40 },
        },
      ],
      'circle',
      'red',
      filled,
    )
    expect(hit).toBe('a')
  })

  it('игнорирует заполненные слоты', () => {
    const filled = new Set(['a'])
    const hit = findSlotHitForShapePiece(
      { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
      [
        {
          id: 'a',
          shape: 'circle',
          color: 'indigo',
          rect: { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40 },
        },
        {
          id: 'b',
          shape: 'circle',
          color: 'indigo',
          rect: { left: 200, top: 200, right: 240, bottom: 240, width: 40, height: 40 },
        },
      ],
      'circle',
      'indigo',
      filled,
    )
    expect(hit).toBeNull()
  })

  it('круг другого цвета не встаёт в чужой слот', () => {
    const hit = findSlotHitForShapePiece(
      { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
      [
        {
          id: 'red-slot',
          shape: 'circle',
          color: 'red',
          rect: { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40 },
        },
      ],
      'circle',
      'yellow',
      new Set(),
    )
    expect(hit).toBeNull()
  })

  it('два круга одного цвета остаются взаимозаменяемыми', () => {
    const hit = findSlotHitForShapePiece(
      { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
      [
        {
          id: 'wheel-l',
          shape: 'circle',
          color: 'indigo',
          rect: { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40 },
        },
      ],
      'circle',
      'indigo',
      new Set(),
    )
    expect(hit).toBe('wheel-l')
  })
})
