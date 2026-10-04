import { describe, expect, it } from 'vitest'
import {
  clearGalleryStars,
  GALLERY_STAR_KEYS,
  loadGalleryStars,
  markGalleryStar,
} from '../../src/shared/gallery-progress'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('звёздочки галерей', () => {
  it('ключ пазла прежний, звёздочки не теряются; у «Пряток» свой ключ; у песочницы звёздочек нет', () => {
    expect(GALLERY_STAR_KEYS.puzzle).toBe('meow-planet.puzzle-solved')
    expect(GALLERY_STAR_KEYS['hide-seek']).toBe('meow-planet.hide-seek-found')
    expect(Object.keys(GALLERY_STAR_KEYS)).toEqual(['puzzle', 'hide-seek'])
  })

  it('отметить, прочитать, сбросить', () => {
    const storage = memoryStorage()
    const ok = (id: string) => ['a', 'b'].includes(id)
    expect([...loadGalleryStars('puzzle', ok, storage)]).toEqual([])
    markGalleryStar('puzzle', 'a', ok, storage)
    markGalleryStar('puzzle', 'b', ok, storage)
    markGalleryStar('puzzle', 'a', ok, storage)
    expect([...loadGalleryStars('puzzle', ok, storage)].sort()).toEqual(['a', 'b'])
    clearGalleryStars('puzzle', storage)
    expect([...loadGalleryStars('puzzle', ok, storage)]).toEqual([])
  })

  it('чужие и битые записи не ломают', () => {
    const storage = memoryStorage()
    const ok = (id: string) => id === 'a'
    storage.setItem(GALLERY_STAR_KEYS.puzzle, '["a","zzz",5]')
    expect([...loadGalleryStars('puzzle', ok, storage)]).toEqual(['a'])
    storage.setItem(GALLERY_STAR_KEYS.puzzle, '{bad')
    expect([...loadGalleryStars('puzzle', ok, storage)]).toEqual([])
  })
})
