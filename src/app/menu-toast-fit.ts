/**
 * «Погладь меня» в меню: размер облачка от ширины персонажа и свободного места
 * над головой (до верха поля и кнопок звука/настроек).
 */
export interface MenuToastFitInput {
  charWidth: number
  spaceAbove: number
}

export interface MenuToastFit {
  fontPx: number
  gapPx: number
}

const FONT_MIN = 14
const FONT_MAX = 27
const FONT_FLOOR = 12
const GAP_MIN = 4

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** Высота облачка: строка 1.1 + поля 0.55em сверху и снизу + рамка и нижняя тень. */
export function menuToastHeight(fontPx: number): number {
  return fontPx * 2.2 + 10
}

export interface MenuVisitScaleInput {
  /** Верх персонажа и низ подставки (подставка стоит на нижней границе поля). */
  figureTop: number
  figureBottom: number
  /** Ниже чего облачку можно стоять: верх поля или низ кнопок над ним. */
  ceiling: number
  /** Сколько нужно облачку вместе с отступами. */
  need: number
}

const VISIT_SCALE_MIN = 0.88

/** Насколько уменьшить персонажа с подставкой, чтобы облачко встало над головой. */
export function menuVisitScale({ figureTop, figureBottom, ceiling, need }: MenuVisitScaleInput): number {
  if (figureTop - ceiling >= need) return 1
  const k = (figureBottom - ceiling - need) / (figureBottom - figureTop)
  return clamp(k, VISIT_SCALE_MIN, 1)
}

export function fitMenuToast({ charWidth, spaceAbove }: MenuToastFitInput): MenuToastFit {
  const idealFont = clamp(charWidth * 0.082, FONT_MIN, FONT_MAX)
  const idealGap = clamp(charWidth * 0.035, 6, 16)
  if (menuToastHeight(idealFont) + 2 * idealGap <= spaceAbove) {
    return { fontPx: idealFont, gapPx: idealGap }
  }
  const gapPx = Math.max(GAP_MIN, Math.min(idealGap, spaceAbove * 0.12))
  const fitFont = (spaceAbove - 2 * gapPx - 10) / 2.2
  return { fontPx: Math.max(FONT_FLOOR, Math.min(idealFont, fitFont)), gapPx }
}
