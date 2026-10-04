import type { RoomBounds } from './room-save'

/**
 * Большая комната (решение владельца 02.10.2026): растёт, когда держишь деталь у края;
 * пустое место — двигать и щипком приближать; «Вся комната» — показать всё.
 * Камера: `x, y` — какая точка комнаты (в «кубиках») в левом верхнем углу экрана, `k` — пикселей в кубике.
 */
export type Camera = { x: number; y: number; k: number }

/** Что камера может показать: от левой стенки до правой, от потолка (с местом под шапку) до низа под полом. */
export type Frame = { x0: number; y0: number; x1: number; y1: number }

export type Rect = { left: number; top: number; right: number; bottom: number }

/** Во сколько раз комната может вырасти: в ширину от начальной и вверх (в высотах экрана). */
export const ROOM_GROW_LIMIT = { width: 4, up: 1.5 } as const

export function roomFrame(room: RoomBounds, unitsH: number, topPad: number): Frame {
  return { x0: room.left, y0: room.top - topPad, x1: room.right, y1: unitsH }
}

/** Масштаб, при котором видна вся комната. */
export function fitScale(frame: Frame, viewW: number, viewH: number): number {
  return Math.min(viewW / (frame.x1 - frame.x0), viewH / (frame.y1 - frame.y0))
}

/**
 * Камера не уезжает за стенки. Комната уже экрана: по ширине — посередине,
 * по высоте — пол внизу экрана, как всегда.
 */
export function clampCamera(cam: Camera, frame: Frame, viewW: number, viewH: number): Camera {
  const seenW = viewW / cam.k
  const seenH = viewH / cam.k
  const fw = frame.x1 - frame.x0
  const fh = frame.y1 - frame.y0
  const x = seenW >= fw ? frame.x0 - (seenW - fw) / 2 : Math.min(Math.max(cam.x, frame.x0), frame.x1 - seenW)
  const y = seenH >= fh ? frame.y1 - seenH : Math.min(Math.max(cam.y, frame.y0), frame.y1 - seenH)
  return { x, y, k: cam.k }
}

/** Приблизить или отдалить в `factor` раз так, чтобы точка под пальцами осталась на месте. */
export function zoomAround(cam: Camera, factor: number, px: number, py: number): Camera {
  const wx = cam.x + px / cam.k
  const wy = cam.y + py / cam.k
  const k = cam.k * factor
  return { x: wx - px / k, y: wy - py / k, k }
}

/**
 * Палец с деталью у края экрана — куда ехать камере (−1…1 по каждой оси, у самого края — 1).
 * Вниз не едем: там пол.
 */
export function edgeDirection(px: number, py: number, rect: Rect, zone: number): { x: number; y: number } {
  const depth = (d: number): number => Math.min(1, Math.max(0, 1 - d / zone))
  let x = 0
  if (px < rect.left + zone) x = -depth(px - rect.left)
  else if (px > rect.right - zone) x = depth(rect.right - px)
  const y = py < rect.top + zone ? -depth(py - rect.top) : 0
  return { x: x === 0 ? 0 : x, y: y === 0 ? 0 : y }
}

/** Отодвинуть стенку или потолок на `amount` кубиков в сторону `dir`, не больше `ROOM_GROW_LIMIT`. */
export function growRoom(
  room: RoomBounds,
  dir: { x: number; y: number },
  amount: number,
  start: RoomBounds,
  unitsH: number,
): RoomBounds {
  const maxW = (start.right - start.left) * ROOM_GROW_LIMIT.width
  const minTop = start.top - unitsH * ROOM_GROW_LIMIT.up
  const next = { ...room }
  const spare = Math.max(0, maxW - (room.right - room.left))
  if (dir.x > 0) next.right = room.right + Math.min(amount, spare)
  else if (dir.x < 0) next.left = room.left - Math.min(amount, spare)
  if (dir.y < 0) next.top = Math.max(minTop, room.top - amount)
  return next
}
