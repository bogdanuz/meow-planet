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
    countingLimit: 3 | 10
    balloonTasksEnabled: boolean
  }>
  /** Сообщить оболочке мягкую подсказку (текст для Мяу). */
  onSoftHint?: (message: string) => void
  /** Иконка задания у Мяu в chrome (без текста на поляне). */
  onTaskVisual?: (cue: GameTaskVisual | null) => void
  /** Навигация хаба (игры без app chrome). */
  hubNavigation?: {
    goMenu: () => void
    goWelcome: () => void
    onSoundToggle?: (on: boolean) => void
  }
  /** Правая часть chrome (кнопки игры рядом с «Назад»). */
  chromeGameActions?: HTMLElement
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
