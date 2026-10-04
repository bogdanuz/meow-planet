import type { Rng } from '../../shared/random'
import type { PuzzlePieceCount } from '../../shared/storage'

/** Кусочек на столе — доля клетки, больше нельзя. */
const TRAY_PIECE_SCALE: Record<PuzzlePieceCount, number> = { 4: 0.9, 6: 0.86, 9: 0.9 }

export const PIECE_TILT_MIN_DEG = 4
export const PIECE_TILT_MAX_DEG = 14

/** До стольких кусочков — крупно, змейкой в один столбец. Больше — две колонки. */
const ZIGZAG_MAX = 4
const ZIGZAG_X = [0.33, 0.67] as const
const ZIGZAG_WIDTH = 0.64
const ZIGZAG_TILT_MAX_DEG = 10
const ZIGZAG_JITTER = 0.03

const TRAY_COLS = 2
/** Запас под наклон в двух колонках: соседи почти не заходят друг на друга. */
const TILT_ROOM = 1.06
const GAP = 8

export type Size = { w: number; h: number }
export type TraySpot = { x: number; y: number; rotate: number }

function isZigzag(count: number): boolean {
  return count <= ZIGZAG_MAX
}

function trayRows(count: number): number {
  return isZigzag(count) ? count : Math.ceil(count / TRAY_COLS)
}

export function trayPieceSize(opts: {
  slotW: number
  slotH: number
  zoneW: number
  zoneH: number
  count: PuzzlePieceCount
}): Size {
  const { slotW, slotH, zoneW, zoneH, count } = opts
  const rows = trayRows(count)
  const maxW = isZigzag(count)
    ? zoneW * ZIGZAG_WIDTH
    : Math.max(1, (zoneW - GAP * (TRAY_COLS + 1)) / TRAY_COLS / TILT_ROOM)
  const maxH = isZigzag(count)
    ? zoneH / rows
    : Math.max(1, (zoneH - GAP * (rows + 1)) / rows / TILT_ROOM)
  const scale = Math.min(TRAY_PIECE_SCALE[count], maxW / slotW, maxH / slotH)
  return { w: slotW * scale, h: slotH * scale }
}

function tiltFor(i: number, row: number, maxDeg: number, rng: Rng): number {
  const tilt = PIECE_TILT_MIN_DEG + rng() * (maxDeg - PIECE_TILT_MIN_DEG)
  const sign = (i + row) % 2 === 0 ? 1 : -1
  return Number((sign * tilt).toFixed(2))
}

/** Центр так, чтобы и наклонённый кусочек целиком лежал на столе. */
function clampSpot(x: number, y: number, rotate: number, zone: Size, piece: Size): TraySpot {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  const halfW = Math.min(zone.w / 2, (piece.w * Math.cos(rad) + piece.h * Math.sin(rad)) / 2)
  const halfH = Math.min(zone.h / 2, (piece.w * Math.sin(rad) + piece.h * Math.cos(rad)) / 2)
  return {
    x: Math.min(zone.w - halfW, Math.max(halfW, x)),
    y: Math.min(zone.h - halfH, Math.max(halfH, y)),
    rotate,
  }
}

/** Центры кусочков на столе: каждый со сдвигом и наклоном, как высыпанные из коробки. */
export function scatterTraySpots(count: number, zone: Size, piece: Size, rng: Rng): TraySpot[] {
  const rows = trayRows(count)
  const cellH = zone.h / rows
  const spots: TraySpot[] = []

  if (isZigzag(count)) {
    for (let i = 0; i < count; i += 1) {
      const x = zone.w * ZIGZAG_X[i % 2]! + (rng() * 2 - 1) * zone.w * ZIGZAG_JITTER
      const y = cellH * (i + 0.5) + (rng() * 2 - 1) * cellH * ZIGZAG_JITTER
      spots.push(clampSpot(x, y, tiltFor(i, 0, ZIGZAG_TILT_MAX_DEG, rng), zone, piece))
    }
    return spots
  }

  const cellW = zone.w / TRAY_COLS
  for (let i = 0; i < count; i += 1) {
    const col = i % TRAY_COLS
    const row = Math.floor(i / TRAY_COLS)
    const lastAlone = count % TRAY_COLS === 1 && i === count - 1
    const baseX = lastAlone ? zone.w / 2 : cellW * (col + 0.5)
    const baseY = cellH * (row + 0.5)
    const freeX = Math.max(0, (cellW - piece.w * TILT_ROOM) / 2) * 0.8
    const freeY = Math.max(0, (cellH - piece.h * TILT_ROOM) / 2) * 0.8
    const x = baseX + (rng() * 2 - 1) * freeX
    const y = baseY + (rng() * 2 - 1) * freeY
    spots.push(clampSpot(x, y, tiltFor(i, row, PIECE_TILT_MAX_DEG, rng), zone, piece))
  }
  return spots
}
