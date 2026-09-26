import { describe, expect, it } from 'vitest'
import { createPuzzleFileInput } from '../../src/shared/puzzle-photos'

describe('puzzle photos helpers', () => {
  it('file input без capture (камера запрещена)', () => {
    const input = createPuzzleFileInput()
    expect(input.type).toBe('file')
    expect(input.accept).toContain('image/')
    expect(input.hasAttribute('capture')).toBe(false)
  })
})
