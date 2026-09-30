import { GAME_IDS, type GameId } from './catalog'

/** Игры с контентом для первого релиза. Остальные открывают заглушку. */
export const RELEASED_GAME_IDS = [
  'balloon-pop',
  'sound-world',
  'drawing',
] as const satisfies readonly GameId[]

export function isGameReleased(id: GameId): boolean {
  return (RELEASED_GAME_IDS as readonly GameId[]).includes(id)
}

/** «Лопни шарик» подставляет имя в подсказку — поле в настройках нужно. */
export const CHILD_NAME_USED_IN_RELEASED_GAMES = true

export function unreleasedGameIds(): GameId[] {
  return GAME_IDS.filter((id) => !isGameReleased(id))
}
