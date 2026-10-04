import type { GameMeta } from '../content/catalog'
import type { GameTaskVisual } from './game-task-visual'

/** Контекст, который оболочка передаёт в игру при mount. */
export type GameMountContext = {
  /** Актуальные настройки (снимок на момент входа в игру). */
  settings: Readonly<{
    childName: string
    soundEnabled: boolean
    musicEnabled: boolean
    quietMode: boolean
    hideEnglishAlphabet: boolean
    countingLimit: 3 | 5 | 10
    countingTasks?: readonly string[]
    countingAutoHints?: boolean
    balloonTasksEnabled: boolean
    companion: 'meow' | 'olli'
    puzzlePieceCount?: 4 | 6 | 9
    puzzleTargetHint?: boolean
    sandboxRealPhysics?: boolean
    sandboxMaxPieces?: 20 | 40 | 60
    sandboxAutoStraight?: boolean
    sandboxHiddenKinds?: readonly string[]
    sandboxSticky?: boolean
    sandboxPieceSize?: 'big' | 'small' | 'tiny'
    hideSeekLevel?: 'easy' | 'medium' | 'hard'
    hideSeekMirror?: boolean
    hideSeekAutoHints?: boolean
    meowHomePotty?: boolean
    meowHomeWishes?: boolean
    meowHomeRealTime?: boolean
    meowHomeSeasonByDate?: boolean
  }>
  /** Сообщить оболочке мягкую подсказку (текст для Мяу). */
  onSoftHint?: (message: string) => void
  /** Иконка задания у Мяу в chrome (без текста на поляне). */
  onTaskVisual?: (cue: GameTaskVisual | null) => void
  /** Навигация хаба (игры без app chrome). */
  hubNavigation?: {
    goMenu: () => void
    goWelcome: () => void
    goSettings?: () => void
    onSoundToggle?: (on: boolean) => void
  }
  /** Подпись сцены/локации в header (прятки — справа). */
  onChromeSceneLabel?: (label: string) => void
}

/**
 * Контракт игрового модуля.
 * Оболочка знает только этот интерфейс — игры не импортируют друг друга.
 */
export type GameModule = {
  readonly meta: GameMeta
  mount(container: HTMLElement, context: GameMountContext): void
  unmount(): void
}
