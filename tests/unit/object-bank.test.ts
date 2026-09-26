import { describe, expect, it } from 'vitest'
import {
  getObjectById,
  listByCategory,
  listSoundObjects,
  OBJECT_BANK,
  OBJECT_CATEGORIES,
} from '../../src/shared/object-bank'

describe('object bank', () => {
  it('все id уникальны', () => {
    const ids = OBJECT_BANK.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('категории валидны', () => {
    for (const obj of OBJECT_BANK) {
      expect(OBJECT_CATEGORIES).toContain(obj.category)
      expect(obj.labelRu.length).toBeGreaterThan(0)
    }
  })

  it('listByCategory и listSoundObjects', () => {
    expect(listByCategory('animals').length).toBeGreaterThan(0)
    expect(listSoundObjects().every((o) => o.hasSound)).toBe(true)
    expect(getObjectById('cat')?.labelRu).toBe('Кошка')
    expect(getObjectById('nope')).toBeUndefined()
  })
})
