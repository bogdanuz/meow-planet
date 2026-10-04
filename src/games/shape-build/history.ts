/** Шаги для «Отменить»: снимок мира перед каждым действием ребёнка, самые старые забываются. */
export class UndoStack<T> {
  private items: T[] = []
  private readonly limit: number

  constructor(limit = 20) {
    this.limit = limit
  }

  push(item: T): void {
    this.items.push(item)
    if (this.items.length > this.limit) this.items.shift()
  }

  pop(): T | undefined {
    return this.items.pop()
  }

  /** Шаг оказался пустым (деталь сразу вернули в шкаф): убрать, если он всё ещё последний. */
  dropLast(item: T): void {
    if (this.items[this.items.length - 1] === item) this.items.pop()
  }

  canUndo(): boolean {
    return this.items.length > 0
  }

  size(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
  }
}
