import type { GameId } from '../../content/catalog'
import { getGameById } from '../../games/registry'
import type { GameModule, GameMountContext } from '../../shared/game-module'
import type { GameTaskVisual } from '../../shared/game-task-visual'
import { loadSettings } from '../../shared/storage'
import { createGamePresenter } from '../../shared/game-presenter'
import { gameUsesPresenter } from '../../shared/companion'
import { isGameReleased } from '../../content/released-games'
import { renderComingSoonScreen } from './coming-soon'

/** Эти игры сами ставят ведущего с позами и голосом; общий не добавляем. */
const GAMES_WITH_OWN_PRESENTER: ReadonlySet<string> = new Set([
  'balloon-pop',
  'sort-colors',
  'hide-seek',
  'counting',
  'meow-home',
])

export type ActiveGameHandle = {
  unmount: () => void
}

/**
 * Монтирует игру из реестра. Защита от двойного запуска — снаружи через unmount
 * предыдущего handle перед новым mount.
 */
export function renderGameScreen(
  container: HTMLElement,
  gameId: GameId,
  onSoftHint: (message: string) => void,
  onTaskVisual?: (cue: GameTaskVisual | null) => void,
  hubNavigation?: GameMountContext['hubNavigation'],
  onChromeSceneLabel?: (label: string) => void,
): ActiveGameHandle | null {
  const game: GameModule | undefined = getGameById(gameId)
  if (!isGameReleased(gameId)) {
    return renderComingSoonScreen(container, hubNavigation)
  }
  if (!game) {
    const missing = document.createElement('p')
    missing.className = 'screen__hint'
    missing.textContent = 'Игра не найдена.'
    container.replaceChildren(missing)
    return null
  }

  const host = document.createElement('div')
  host.className = 'screen screen--game'
  host.dataset.gameId = gameId
  container.replaceChildren(host)

  const settings = loadSettings()
  const sharedPresenter = gameUsesPresenter(gameId) && !GAMES_WITH_OWN_PRESENTER.has(gameId)
  const presenter = sharedPresenter ? createGamePresenter(settings.companion) : null
  game.mount(host, {
    settings: {
      childName: settings.childName,
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      quietMode: settings.quietMode,
      hideEnglishAlphabet: settings.hideEnglishAlphabet,
      countingLimit: settings.countingLimit,
      countingTasks: settings.countingTasks,
      countingAutoHints: settings.countingAutoHints,
      balloonTasksEnabled: settings.balloonTasksEnabled,
      companion: settings.companion,
      puzzlePieceCount: settings.puzzlePieceCount,
      puzzleTargetHint: settings.puzzleTargetHint,
      sandboxRealPhysics: settings.sandboxRealPhysics,
      sandboxMaxPieces: settings.sandboxMaxPieces,
      sandboxAutoStraight: settings.sandboxAutoStraight,
      sandboxHiddenKinds: settings.sandboxHiddenKinds,
      sandboxSticky: settings.sandboxSticky,
      sandboxPieceSize: settings.sandboxPieceSize,
      hideSeekLevel: settings.hideSeekLevel,
      hideSeekMirror: settings.hideSeekMirror,
      hideSeekAutoHints: settings.hideSeekAutoHints,
      meowHomePotty: settings.meowHomePotty,
      meowHomeWishes: settings.meowHomeWishes,
      meowHomeRealTime: settings.meowHomeRealTime,
      meowHomeSeasonByDate: settings.meowHomeSeasonByDate,
    },
    onSoftHint: (message: string) => {
      onSoftHint(message)
      if (sharedPresenter) {
        presenter?.setLine(message, message ? 'happy' : 'idle')
      }
    },
    onTaskVisual,
    hubNavigation,
    onChromeSceneLabel,
  })
  if (presenter) host.append(presenter.element)

  return {
    unmount: () => {
      game.unmount()
    },
  }
}
