export type FrameBatch = {
  /** Попросить выполнить работу в ближайшем кадре; повторные просьбы в том же кадре склеиваются. */
  request: () => void
  /** Выполнить отложенную работу сейчас (например, на отпускании пальца). */
  flush: () => void
  cancel: () => void
}

/**
 * Не чаще одного раза за кадр. Палец на iPad шлёт 120 событий в секунду, Apple Pencil — 240:
 * перерисовка на каждое событие делает 2–4 полные отрисовки холста за кадр.
 */
export function createFrameBatch(work: () => void): FrameBatch {
  let frame = 0
  const run = (): void => {
    frame = 0
    work()
  }
  return {
    request() {
      if (frame === 0) frame = requestAnimationFrame(run)
    },
    flush() {
      if (frame === 0) return
      cancelAnimationFrame(frame)
      run()
    },
    cancel() {
      if (frame !== 0) cancelAnimationFrame(frame)
      frame = 0
    },
  }
}
