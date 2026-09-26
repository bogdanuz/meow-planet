import interact from 'interactjs'

export type TapTapOptions = {
  /** Источник выбран (первый тап). */
  onPickup?: (el: HTMLElement) => void
  /** Успешный тап по цели. */
  onDrop: (source: HTMLElement, target: HTMLElement) => void
  /** Отмена (повторный тап по источнику / Esc). */
  onCancel?: () => void
  /** Можно ли положить в эту цель. */
  canDrop?: (source: HTMLElement, target: HTMLElement) => boolean
}

export type TapTapController = {
  destroy: () => void
  getSelected: () => HTMLElement | null
}

/**
 * Тап → тап: выбрать объект, затем тапнуть цель.
 * Подходит для «Куда положить?» без обязательного drag.
 */
export function bindTapTap(
  sources: HTMLElement[],
  targets: HTMLElement[],
  options: TapTapOptions,
): TapTapController {
  let selected: HTMLElement | null = null

  function clearSelection(): void {
    if (selected) selected.classList.remove('is-selected')
    selected = null
  }

  function onSourceClick(event: Event): void {
    const el = event.currentTarget as HTMLElement
    if (selected === el) {
      clearSelection()
      options.onCancel?.()
      return
    }
    clearSelection()
    selected = el
    el.classList.add('is-selected')
    options.onPickup?.(el)
  }

  function onTargetClick(event: Event): void {
    if (!selected) return
    const target = event.currentTarget as HTMLElement
    if (options.canDrop && !options.canDrop(selected, target)) return
    const source = selected
    clearSelection()
    options.onDrop(source, target)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && selected) {
      clearSelection()
      options.onCancel?.()
    }
  }

  for (const source of sources) {
    source.addEventListener('click', onSourceClick)
  }
  for (const target of targets) {
    target.addEventListener('click', onTargetClick)
  }
  window.addEventListener('keydown', onKeyDown)

  return {
    getSelected: () => selected,
    destroy: () => {
      for (const source of sources) {
        source.removeEventListener('click', onSourceClick)
      }
      for (const target of targets) {
        target.removeEventListener('click', onTargetClick)
      }
      window.removeEventListener('keydown', onKeyDown)
      clearSelection()
    },
  }
}

export type DragDropOptions = {
  onDrop: (source: HTMLElement, target: HTMLElement) => void
  canDrop?: (source: HTMLElement, target: HTMLElement) => boolean
  /** CSS-селектор целей (для interact dropzone). */
  targetSelector: string
  /** CSS-селектор принимаемых источников (по умолчанию — все). */
  accept?: string
}

/**
 * Drag через interactjs + защита от случайного скролла на touch.
 */
export function bindDragDrop(
  sources: HTMLElement[],
  options: DragDropOptions,
): { destroy: () => void } {
  const cleanups: Array<() => void> = []

  for (const source of sources) {
    source.style.touchAction = 'none'
    const interaction = interact(source).draggable({
      inertia: false,
      modifiers: [],
      listeners: {
        move(event) {
          const target = event.target as HTMLElement
          const x = (Number.parseFloat(target.dataset.x ?? '0') || 0) + event.dx
          const y = (Number.parseFloat(target.dataset.y ?? '0') || 0) + event.dy
          target.dataset.x = String(x)
          target.dataset.y = String(y)
          target.style.transform = `translate(${x}px, ${y}px)`
          target.classList.add('is-dragging')
        },
        end(event) {
          const target = event.target as HTMLElement
          target.dataset.x = '0'
          target.dataset.y = '0'
          target.style.transform = ''
          target.classList.remove('is-dragging')
        },
      },
    })

    cleanups.push(() => {
      interaction.unset()
      source.style.touchAction = ''
      source.style.transform = ''
      source.classList.remove('is-dragging')
      delete source.dataset.x
      delete source.dataset.y
    })
  }

  const dropzone = interact(options.targetSelector).dropzone({
    accept: options.accept ?? '*',
    overlap: 0.35,
    ondragenter(event) {
      ;(event.target as HTMLElement).classList.add('is-drop-target')
    },
    ondragleave(event) {
      ;(event.target as HTMLElement).classList.remove('is-drop-target')
    },
    ondrop(event) {
      const source = event.relatedTarget as HTMLElement
      const target = event.target as HTMLElement
      target.classList.remove('is-drop-target')
      if (options.canDrop && !options.canDrop(source, target)) return
      options.onDrop(source, target)
    },
  })

  cleanups.push(() => {
    dropzone.unset()
  })

  return {
    destroy: () => {
      for (const fn of cleanups) fn()
    },
  }
}
