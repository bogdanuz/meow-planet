import { describe, expect, it } from 'vitest'
import {
  PLACEHOLDER_COLORS,
  placeholderClass,
} from '../../src/shared/placeholders'

describe('placeholders', () => {
  it('собирает классы формы и цвета', () => {
    expect(placeholderClass('circle', 'red')).toBe('ph ph--circle ph-color--red')
    expect(placeholderClass('balloon')).toBe('ph ph--balloon')
  })

  it('в радуге 7 цветов', () => {
    expect(PLACEHOLDER_COLORS).toHaveLength(7)
  })
})
