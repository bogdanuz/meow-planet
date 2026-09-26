type TimerId = ReturnType<typeof setTimeout> | number

/** Короткоживущие таймеры экрана: снимаются при выходе из игры. */
export function createTimerBag() {
  const ids = new Set<TimerId>()

  return {
    track<T extends TimerId>(id: T): T {
      ids.add(id)
      return id
    },
    clear(): void {
      for (const id of ids) clearTimeout(id)
      ids.clear()
    },
  }
}
