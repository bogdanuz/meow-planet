/** «В гости» — желания персонажа (бриф S16, тур 4): одно за раз, без наказаний. */
import type { Rng } from '../../shared/random'

export const WISHES = ['hungry', 'sleepy', 'dirty', 'messy', 'teeth', 'potty', 'play', 'cold'] as const
export type Wish = (typeof WISHES)[number]

export type Room = 'hall' | 'bath' | 'kitchen' | 'bedroom' | 'yard'

export type CareAction =
  | 'eat'
  | 'drink'
  | 'cocoa'
  | 'napkin'
  | 'teeth'
  | 'wash-paws'
  | 'bath'
  | 'towel'
  | 'potty'
  | 'sleep'
  | 'book'
  | 'ball'
  | 'blocks'
  | 'pajama'

export const WISH_ROOM: Record<Wish, Room> = {
  hungry: 'kitchen',
  sleepy: 'bedroom',
  dirty: 'bath',
  messy: 'kitchen',
  teeth: 'bath',
  potty: 'bath',
  play: 'bedroom',
  cold: 'kitchen',
}

const FULFILS: Record<Wish, readonly CareAction[]> = {
  hungry: ['eat', 'drink'],
  sleepy: ['sleep'],
  dirty: ['wash-paws', 'bath'],
  messy: ['napkin', 'bath'],
  teeth: ['teeth'],
  potty: ['potty'],
  play: ['ball', 'blocks', 'book'],
  cold: ['cocoa', 'sleep', 'bath'],
}

/** Новое желание само — не чаще раза в минуту. */
export const WISH_GAP_MS = 60_000
/** Не помогли — перестаёт просить и просто играет. */
export const WISH_GIVE_UP_MS = 20_000
/** Первое желание после входа — раньше минуты, чтобы ребёнок успел его увидеть. */
const FIRST_WISH_MS = 30_000

export type WishesOptions = { potty: boolean; enabled: boolean; rng: Rng; now: number; night: boolean }

export function createWishes(opts: WishesOptions) {
  let current: Wish | null = null
  let since = 0
  let lastEnd = opts.now - (WISH_GAP_MS - FIRST_WISH_MS)
  let night = opts.night
  const queue: Wish[] = []

  const allowed = (wish: Wish): boolean => opts.enabled && (wish !== 'potty' || opts.potty)

  const end = (now: number): void => {
    current = null
    lastEnd = now
  }

  const randomWish = (): Wish => {
    if (night) return 'sleepy'
    const pool: Wish[] = opts.potty ? ['hungry', 'play', 'potty'] : ['hungry', 'play']
    return pool[Math.min(pool.length - 1, Math.floor(opts.rng() * pool.length))]!
  }

  return {
    current: (): Wish | null => current,
    setNight(value: boolean): void {
      night = value
    },
    /** Раз в секунду: снимает надоевшее желание, достаёт следующее. Возвращает новое желание. */
    tick(now: number): Wish | null {
      if (current && now - since > WISH_GIVE_UP_MS) end(now)
      if (current) return null
      const next = queue.shift() ?? (opts.enabled && now - lastEnd > WISH_GAP_MS ? randomWish() : null)
      if (!next) return null
      current = next
      since = now
      return next
    },
    /** Событие в игре (вернулся с улицы, поел): желание сразу или в очередь. */
    trigger(wish: Wish, now: number): void {
      if (!allowed(wish) || current === wish || queue.includes(wish)) return
      if (current) {
        queue.push(wish)
        return
      }
      current = wish
      since = now
    },
    /** Забота: если она исполняет текущее желание — вернёт его. Любая другая забота тоже радует, желание остаётся. */
    fulfil(action: CareAction, now: number): Wish | null {
      if (!current || !FULFILS[current].includes(action)) return null
      const done = current
      end(now)
      return done
    },
  }
}

export type Wishes = ReturnType<typeof createWishes>
