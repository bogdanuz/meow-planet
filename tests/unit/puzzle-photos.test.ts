import { describe, expect, it } from 'vitest'
import {
  createPuzzleFileInput,
  defaultPhotoTitle,
  PUZZLE_PHOTO_TITLE_MAX,
  sanitizePhotoTitle,
} from '../../src/shared/puzzle-photos'

describe('puzzle photos helpers', () => {
  it('file input без capture (камера запрещена)', () => {
    const input = createPuzzleFileInput()
    expect(input.type).toBe('file')
    expect(input.accept).toContain('image/')
    expect(input.hasAttribute('capture')).toBe(false)
  })

  it('подпись: без лишних пробелов, служебных символов и не длиннее предела', () => {
    expect(sanitizePhotoTitle('  Бабушка   и\tдедушка  ')).toBe('Бабушка и дедушка')
    expect(sanitizePhotoTitle('Кот\u0000\u0007 Мурзик')).toBe('Кот Мурзик')
    expect(sanitizePhotoTitle('   ')).toBe('')
    const long = sanitizePhotoTitle('а'.repeat(80))
    expect(long).toHaveLength(PUZZLE_PHOTO_TITLE_MAX)
  })

  it('без подписи — «Моё фото N» с первым свободным номером', () => {
    expect(defaultPhotoTitle([])).toBe('Моё фото 1')
    expect(defaultPhotoTitle(['Моё фото 1', 'Моё фото 3', 'Мама'])).toBe('Моё фото 2')
    expect(defaultPhotoTitle(['Моё фото 1', 'Моё фото 2'])).toBe('Моё фото 3')
  })
})
