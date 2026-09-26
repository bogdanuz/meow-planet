import { describe, expect, it } from 'vitest'
import { ANIMAL_PAGE_SWIPE_PX, shouldTurnAnimalPage } from './page-swipe'

describe('sound-world page swipe', () => {
  it('не листает, если жест начался на карточке', () => {
    expect(
      shouldTurnAnimalPage({
        dx: -200,
        startedOnCard: true,
        mainTab: 'animals',
        instrumentOpen: false,
      }),
    ).toBe(false)
  })

  it('не листает короткий сдвиг как у детского тапа', () => {
    expect(
      shouldTurnAnimalPage({
        dx: -56,
        startedOnCard: false,
        mainTab: 'animals',
        instrumentOpen: false,
      }),
    ).toBe(false)
  })

  it('листает только длинный свайп мимо карточки', () => {
    expect(ANIMAL_PAGE_SWIPE_PX).toBeGreaterThanOrEqual(120)
    expect(
      shouldTurnAnimalPage({
        dx: -ANIMAL_PAGE_SWIPE_PX,
        startedOnCard: false,
        mainTab: 'animals',
        instrumentOpen: false,
      }),
    ).toBe(true)
  })
})
