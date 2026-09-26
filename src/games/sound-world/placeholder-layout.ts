import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'

export type PlaceholderVisual = { shape: PlaceholderShape; color: PlaceholderColor }

const SHAPES: PlaceholderShape[] = ['circle', 'rect', 'triangle', 'star', 'square']
const COLORS: PlaceholderColor[] = ['orange', 'yellow', 'red', 'green', 'violet', 'blue']

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function same(a: PlaceholderVisual, b: PlaceholderVisual): boolean {
  return a.shape === b.shape && a.color === b.color
}

/** Минимизирует одинаковые фигура+цвет у соседних карточек в порядке сетки. */
export function placeholderVisualsForCards(
  cards: readonly { id: string; shape: PlaceholderShape; color: PlaceholderColor }[],
): PlaceholderVisual[] {
  const out: PlaceholderVisual[] = []
  for (let i = 0; i < cards.length; i += 1) {
    let visual: PlaceholderVisual = { shape: cards[i].shape, color: cards[i].color }
    const prev = out[i - 1]
    if (prev && same(visual, prev)) {
      const h = hashId(cards[i].id)
      for (let attempt = 0; attempt < SHAPES.length * COLORS.length; attempt += 1) {
        const shape = SHAPES[(h + attempt) % SHAPES.length]
        const color = COLORS[Math.floor((h + attempt) / SHAPES.length) % COLORS.length]
        const candidate = { shape, color }
        if (!same(candidate, prev)) {
          visual = candidate
          break
        }
      }
    }
    out.push(visual)
  }
  return out
}
