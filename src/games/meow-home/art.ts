/** «В гости» — пути к арту. Файлы режет `npm run assets:meow-home` из `assets-master/games/meow-home/`. */
import type { Room } from './wishes'
import type { Season, WearItem } from './weather'

export type Who = 'meow' | 'olli'

/** Кадры дома: у каждого действия два кадра одного масштаба и одной линии пола. */
export const FRAME_ACTIONS = [
  'idle',
  'wave',
  'giggle',
  'purr',
  'joy',
  'hungry',
  'eat',
  'drink',
  'messy',
  'napkin',
  'teeth',
  'wash-paws',
  'dirty-paws',
  'bath',
  'towel',
  'potty',
  'potty-dance',
  'shiver',
  'yawn',
  'want-play',
  'ball',
  'blocks',
  'book',
  'sleep',
  'wake',
  'pj-idle',
  'pj-wave',
  'pj-yawn',
] as const
export type FrameAction = (typeof FRAME_ACTIONS)[number]

export type FaceMood = 'cold' | 'hot' | 'joy' | 'sleepy' | 'wet'

const root = (): string => `${import.meta.env.BASE_URL ?? '/'}assets/games/meow-home/`

export const bgUrl = (name: string): string => `${root()}bg/${name}.webp`
export const itemUrl = (name: string): string => `${root()}items/${name}.webp`
export const frameUrl = (who: Who, action: FrameAction, n: 1 | 2): string => `${root()}${who}/f-${action}-${n}.webp`
export const standUrl = (who: Who): string => `${root()}${who}/stand.webp`
export const faceUrl = (who: Who, mood: FaceMood): string => `${root()}${who}/face-${mood}.webp`
export const wearUrl = (who: Who, item: Exclude<WearItem, 'umbrella'>): string => `${root()}${who}/wear-${item}.webp`

/** Иконка вещи на вешалке и в корзинке: своя для кота и совы, зонтик общий. */
export const wearIconUrl = (who: Who, item: WearItem): string =>
  item === 'umbrella' ? itemUrl('umbrella') : itemUrl(`wear-${who}-${item}`)

export function roomBgUrl(room: Exclude<Room, 'yard'>, night: boolean, fridgeOpen = false): string {
  if (room === 'kitchen' && fridgeOpen && !night) return bgUrl('kitchen-fridge-open')
  return bgUrl(`${room}-${night ? 'night' : 'day'}`)
}

export const yardBgUrl = (season: Season, night: boolean): string => bgUrl(`yard-${season}-${night ? 'night' : 'day'}`)
export const seasonThumbUrl = (season: Season): string => bgUrl(`yard-${season}-thumb`)
