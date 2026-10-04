/**
 * Игрушки и ящик из «Куда положить?» — одни картинки на все игры (`public/assets/games/sort-colors/`).
 * Игры не импортируют друг друга, поэтому общие пути и геометрия ящика живут здесь.
 */

export const TOY_KINDS = ['ball', 'cube', 'star', 'pyramid', 'heart', 'duck', 'ring'] as const
export type ToyKind = (typeof TOY_KINDS)[number]

export const TOY_COLORS = ['red', 'yellow', 'blue', 'green'] as const
export type ToyColor = (typeof TOY_COLORS)[number]

export function isToyKind(value: unknown): value is ToyKind {
  return typeof value === 'string' && (TOY_KINDS as readonly string[]).includes(value)
}

const dir = (): string => `${import.meta.env.BASE_URL ?? '/'}assets/games/sort-colors`

export const toyArtUrl = (kind: ToyKind, color: ToyColor): string => `${dir()}/toys/${kind}-${color}.png`
export const toyBinUrl = (): string => `${dir()}/bin.png`

/**
 * Геометрия bin.png в долях картинки (ширина × высота).
 * opening — область центров игрушек (выше проёма: игрушки торчат из ящика);
 * front — передний край проёма слева направо (ниже линии игрушки скрыты стенкой);
 * sticker — центр и ширина наклейки на передней стенке.
 */
export type ToyBinGeometry = {
  aspect: number
  opening: { x: number; y: number; w: number; h: number }
  front: readonly (readonly [number, number])[]
  sticker: { x: number; y: number; w: number }
}

export const TOY_BIN: ToyBinGeometry = {
  aspect: 1.391,
  opening: { x: 0.1, y: -0.27, w: 0.72, h: 0.42 },
  front: [
    [0.05, 0.095],
    [0.83, 0.135],
    [0.955, 0.04],
  ],
  sticker: { x: 0.435, y: 0.57, w: 0.3 },
}

const pct = (v: number): string => `${(v * 100).toFixed(2)}%`

/** clip-path слоя с игрушками: всё выше переднего края ящика, ниже — спрятано стенкой. */
export function toyBinClipPath(g: ToyBinGeometry = TOY_BIN): string {
  const first = g.front[0]!
  const last = g.front[g.front.length - 1]!
  const pts: string[] = ['-25% -90%', '125% -90%', `125% ${pct(last[1])}`]
  for (const [x, y] of [...g.front].reverse()) pts.push(`${pct(x)} ${pct(y)}`)
  pts.push(`-25% ${pct(first[1])}`)
  return `polygon(${pts.join(', ')})`
}
