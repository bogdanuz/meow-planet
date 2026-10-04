/**
 * Рисунки владельца для «Собери что угодно!» (`docs/assets/shape-build-ART.md`).
 * Пока флаг false — комната и шкаф рисуются кодом.
 * Флаг включать только вместе с файлом в `public/` (иначе offline-кэш не найдёт его).
 */
export const SANDBOX_ART_READY = {
  room: true,
  cabinet: true,
} as const

function asset(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/shape-build/${file}`
}

/** Комната растёт в любую сторону: обои и полоса пола (плинтус + пол) кладутся плиткой. */
export function sandboxRoomUrls(): { wall: string; floor: string } | null {
  return SANDBOX_ART_READY.room ? { wall: asset('room-wall.webp'), floor: asset('room-floor.webp') } : null
}

export function sandboxCabinetUrl(): string | null {
  return SANDBOX_ART_READY.cabinet ? asset('cabinet.webp') : null
}

/** Рука-подсказка (лежит в `public/` всегда). */
export function sandboxHandUrl(): string {
  return asset('hand.png')
}

/** Детали с листов владельца: `npm run assets:shape-build` режет их в `pieces/`. */
export function sandboxPieceUrl(name: string): string {
  return asset(`pieces/${name}.png`)
}
