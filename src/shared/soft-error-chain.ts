/**
 * Мягкая цепочка после неверного выбора (идея §7): без «неверно» и наказаний.
 * neutral → намёк → подсветка правильного.
 */

export type SoftErrorChainState = {
  wrongCount: number
}

export type SoftErrorChainMessages = {
  /** Повтор задания (1-я ошибка). */
  repeat: string
  /** Чуть явнее (2-я ошибка). */
  nudge: string
  /** Перед подсветкой (3+). */
  beforeHighlight?: string
}

export type SoftErrorChainStep = {
  message: string
  shouldHighlight: boolean
  wiggle: true
}

export function createSoftErrorChain(): SoftErrorChainState {
  return { wrongCount: 0 }
}

export function resetSoftErrorChain(state: SoftErrorChainState): void {
  state.wrongCount = 0
}

export function recordSoftSuccess(state: SoftErrorChainState): void {
  state.wrongCount = 0
}

/** Вызывать только при мягком промахе (не при успехе). */
export function advanceSoftErrorChain(
  state: SoftErrorChainState,
  messages: SoftErrorChainMessages,
): SoftErrorChainStep {
  state.wrongCount += 1
  const n = state.wrongCount

  if (n >= 3) {
    return {
      message: messages.beforeHighlight ?? messages.nudge,
      shouldHighlight: true,
      wiggle: true,
    }
  }
  if (n === 2) {
    return { message: messages.nudge, shouldHighlight: false, wiggle: true }
  }
  return { message: messages.repeat, shouldHighlight: false, wiggle: true }
}
