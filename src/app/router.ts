import { GAME_IDS, type GameId } from '../content/catalog'

/** Hash-маршруты — надёжны на GitHub Pages с `base: './'`. */
export type Route =
  | { screen: 'welcome' }
  | { screen: 'menu' }
  | { screen: 'game'; gameId: GameId }
  | { screen: 'parent'; returnTo?: GameId }
  | { screen: 'not-found' }

/** Игры, влитые в другие 01.10.2026: старые закладки ведут в новое место. */
const MERGED_GAME_IDS: Readonly<Record<string, GameId>> = {
  coloring: 'drawing',
  seasons: 'meow-home',
}

export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value)
}

function resolveGameId(value: string): GameId | null {
  if (isGameId(value)) return value
  return MERGED_GAME_IDS[value] ?? null
}

/**
 * Разбор hash: `#/`, `#/menu`, `#/welcome`, `#/game/:id`, `#/parent`, `#/parent/:gameId`.
 * Старые `#/map`, `#/loading`, `#/zone/:id` → меню или welcome (без UI зон).
 */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '').trim()
  const path = raw.startsWith('/') ? raw : `/${raw}`
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { screen: 'menu' }

  const [head, id] = parts

  if (
    (head === 'welcome' || head === 'loading') &&
    parts.length === 1
  ) {
    return { screen: 'welcome' }
  }

  if (
    (head === 'menu' || head === 'map' || head === '') &&
    parts.length === 1
  ) {
    return { screen: 'menu' }
  }

  if (head === 'parent' && parts.length === 1) return { screen: 'parent' }
  if (head === 'parent' && id && parts.length === 2) {
    const returnTo = resolveGameId(id)
    return returnTo ? { screen: 'parent', returnTo } : { screen: 'parent' }
  }

  // Старые закладки зон → сразу в меню плиток
  if (head === 'zone' && parts.length === 2) {
    return { screen: 'menu' }
  }

  if (head === 'game' && id && parts.length === 2) {
    const gameId = resolveGameId(id)
    return gameId ? { screen: 'game', gameId } : { screen: 'not-found' }
  }

  return { screen: 'not-found' }
}

export function routeToHash(route: Route): string {
  switch (route.screen) {
    case 'welcome':
      return '#/welcome'
    case 'menu':
      return '#/'
    case 'game':
      return `#/game/${route.gameId}`
    case 'parent':
      return route.returnTo ? `#/parent/${route.returnTo}` : '#/parent'
    case 'not-found':
      return '#/not-found'
  }
}

export function getTitleForRoute(route: Route): string {
  switch (route.screen) {
    case 'welcome':
      return 'Планета Мяу и друзья'
    case 'menu':
      return 'Планета Мяу и друзья'
    case 'game':
      return route.gameId
    case 'parent':
      return 'Настройки'
    case 'not-found':
      return 'Не найдено'
  }
}
