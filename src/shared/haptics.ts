const POP_MS = 12

/** Лёгкая вибрация при лопании; выкл в тихом режиме. */
export function softPopHaptic(quietMode: boolean): void {
  if (quietMode) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  try {
    navigator.vibrate(POP_MS)
  } catch {
    // ignore
  }
}
