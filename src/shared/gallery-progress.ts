/** Звёздочки «собрано» в галереях игр. Сброс — в разделе игры в настройках хаба. */
export const GALLERY_STAR_KEYS = {
  puzzle: 'meow-planet.puzzle-solved',
  'hide-seek': 'meow-planet.hide-seek-found',
} as const

export type GalleryStarGame = keyof typeof GALLERY_STAR_KEYS

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function loadGalleryStars<T extends string>(
  game: GalleryStarGame,
  isId: (value: string) => value is T,
  storage?: StorageLike,
): Set<T>
export function loadGalleryStars(
  game: GalleryStarGame,
  isId: (value: string) => boolean,
  storage?: StorageLike,
): Set<string>
export function loadGalleryStars(
  game: GalleryStarGame,
  isId: (value: string) => boolean,
  storage?: StorageLike,
): Set<string> {
  try {
    const raw = (storage ?? localStorage).getItem(GALLERY_STAR_KEYS[game])
    const data: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(data)) return new Set()
    return new Set(data.filter((v): v is string => typeof v === 'string' && isId(v)))
  } catch {
    return new Set()
  }
}

export function markGalleryStar<T extends string>(
  game: GalleryStarGame,
  id: T,
  isId: (value: string) => boolean,
  storage?: StorageLike,
): Set<string> {
  const stars = loadGalleryStars(game, isId, storage)
  stars.add(id)
  try {
    ;(storage ?? localStorage).setItem(GALLERY_STAR_KEYS[game], JSON.stringify([...stars]))
  } catch {
    // Память браузера полна — звёздочка просто не запомнится.
  }
  return stars
}

export function clearGalleryStars(
  game: GalleryStarGame,
  storage?: Pick<Storage, 'removeItem'>,
): void {
  try {
    ;(storage ?? localStorage).removeItem(GALLERY_STAR_KEYS[game])
  } catch {
    // ignore
  }
}
