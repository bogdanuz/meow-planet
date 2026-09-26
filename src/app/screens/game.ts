import type { GameId } from '../../content/catalog'
import { getGameById } from '../../games/registry'
import type { GameModule, GameMountContext } from '../../shared/game-module'
import type { GameTaskVisual } from '../../shared/game-task-visual'
import { loadSettings } from '../../shared/storage'
import { isGameReleased } from '../../content/released-games'
import { renderComingSoonScreen } from './coming-soon'

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
  chromeGameActions?: HTMLElement,
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
  game.mount(host, {
    settings: {
      childName: settings.childName,
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      quietMode: settings.quietMode,
      hideEnglishAlphabet: settings.hideEnglishAlphabet,
      countingLimit: settings.countingLimit,
      balloonTasksEnabled: settings.balloonTasksEnabled,
    },
    onSoftHint,
    onTaskVisual,
    hubNavigation,
    chromeGameActions,
    onChromeSceneLabel,
  })

  return {
    unmount: () => {
      game.unmount()
    },
  }
}
