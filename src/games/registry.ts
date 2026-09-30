import type { GameId, ZoneId } from '../content/catalog'
import type { GameModule } from '../shared/game-module'
import { balloonPopGame } from './balloon-pop'
import { countingGame } from './counting'
import { drawingGame } from './drawing'
import { hideSeekGame } from './hide-seek'
import { meowHomeGame } from './meow-home'
import { puzzleGame } from './puzzle'
import { shapeBuildGame } from './shape-build'
import { sortColorsGame } from './sort-colors'
import { soundWorldGame } from './sound-world'

/**
 * Реестр всех игр MVP.
 * Чтобы добавить игру в оболочку — достаточно записи здесь; shell не править.
 */
export const GAME_REGISTRY: readonly GameModule[] = [
  balloonPopGame,
  soundWorldGame,
  drawingGame,
  sortColorsGame,
  puzzleGame,
  shapeBuildGame,
  hideSeekGame,
  meowHomeGame,
  countingGame,
]

const byId = new Map<GameId, GameModule>(
  GAME_REGISTRY.map((game) => [game.meta.id, game]),
)

export function getGameById(id: GameId): GameModule | undefined {
  return byId.get(id)
}

export function listGamesByZone(zoneId: ZoneId): readonly GameModule[] {
  return GAME_REGISTRY.filter((game) => game.meta.zoneId === zoneId)
}

export function listAllGameIds(): readonly GameId[] {
  return GAME_REGISTRY.map((game) => game.meta.id)
}
