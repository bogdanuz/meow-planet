/**
 * Крупная плитка меню: цветная метка + подпись для взрослого.
 * Ребёнок 2–3 лет ориентируется по цвету и форме, не обязан читать текст.
 */
export function createVisualTile(options: {
  className: string
  label: string
  dataset?: Record<string, string>
}): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `touch-btn ${options.className}`
  btn.setAttribute('aria-label', options.label)

  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      btn.dataset[key] = value
    }
  }

  const mark = document.createElement('span')
  mark.className = 'tile-mark'
  mark.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.className = 'tile-label'
  label.textContent = options.label

  btn.append(mark, label)
  return btn
}
