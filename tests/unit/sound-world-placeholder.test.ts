import { describe, expect, it } from 'vitest'
import { placeholderVisualsForCards } from '../../src/games/sound-world/placeholder-layout'

describe('sound-world placeholder layout', () => {
  it('соседние карточки не дублируют фигуру и цвет', () => {
    const cards = [
      { id: 'cat', shape: 'circle' as const, color: 'orange' as const },
      { id: 'bear', shape: 'circle' as const, color: 'orange' as const },
      { id: 'monkey', shape: 'circle' as const, color: 'orange' as const },
    ]
    const visuals = placeholderVisualsForCards(cards)
    expect(visuals[0]).toEqual({ shape: 'circle', color: 'orange' })
    expect(visuals[1]).not.toEqual(visuals[0])
    expect(visuals[2]).not.toEqual(visuals[1])
  })
})
