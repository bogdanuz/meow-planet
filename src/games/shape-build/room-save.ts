import { isPieceKind } from './pieces'
import type { SandboxSnapshot, SnapPiece } from './physics'

/**
 * Постройка сохраняется при выходе и возвращается при следующем входе
 * (решение владельца 02.10.2026): детали, провода, склейки, прибитое, размер комнаты.
 * Только localStorage этого устройства; имя ребёнка и фото сюда не попадают.
 */
export const ROOM_SAVE_KEY = 'meow-planet.shape-build-room'

const VERSION = 1
const MAX_PIECES = 400
const MAX_COORD = 1000
const COLOR = /^#[0-9a-f]{6}$/i

/** Стенки и потолок комнаты в «кубиках»; пол всегда внизу экрана. */
export type RoomBounds = { left: number; right: number; top: number }

/** `unitsH` — высота экрана в кубиках («Размер деталей»): от неё зависит, где пол. */
export type RoomSave = { room: RoomBounds; snap: SandboxSnapshot; unitsH?: number }

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_COORD
}

function isIndex(value: unknown, count: number): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < count
}

function readPiece(raw: unknown): SnapPiece | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.kind !== 'string' || !isPieceKind(p.kind)) return null
  if (!isNum(p.x) || !isNum(p.y) || !isNum(p.angle) || !isNum(p.size) || p.size <= 0 || p.size > 4) return null
  if (typeof p.color !== 'string' || !COLOR.test(p.color)) return null
  const piece: SnapPiece = {
    kind: p.kind,
    x: p.x,
    y: p.y,
    angle: p.angle,
    color: p.color,
    size: p.size,
    flip: p.flip === true,
    on: p.on === true,
  }
  if (p.rope !== undefined) {
    const rope = p.rope as Record<string, unknown> | null
    if (!rope || !isNum(rope.ax) || !isNum(rope.length) || rope.length <= 0) return null
    piece.rope = { ax: rope.ax, length: rope.length }
  }
  if (p.len !== undefined) {
    if (!isNum(p.len) || p.len <= 0 || p.len > 4) return null
    piece.len = p.len
  }
  if (p.parked === true) piece.parked = true
  if (p.loose === true) piece.loose = true
  if (p.pinned === true) piece.pinned = true
  if (p.auto === true) piece.auto = true
  if (p.ropeCut === true) piece.ropeCut = true
  return piece
}

function readPairs(raw: unknown, count: number, width: number): number[][] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return null
  const out: number[][] = []
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 2 || entry.length > width) return null
    if (!isIndex(entry[0], count) || !isIndex(entry[1], count)) return null
    if (!entry.slice(2).every(isNum)) return null
    out.push(entry as number[])
  }
  return out
}

function readIndexes(raw: unknown, count: number): number[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw) || !raw.every((i) => isIndex(i, count))) return null
  return raw as number[]
}

/** Разобрать сохранение; всё подозрительное — `null` (пустая комната, игра не ломается). */
export function parseRoomSave(text: string | null): RoomSave | null {
  if (!text) return null
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.v !== VERSION) return null
  const room = d.room as Record<string, unknown> | undefined
  if (!room || !isNum(room.left) || !isNum(room.right) || !isNum(room.top) || room.right <= room.left) return null
  const snap = d.snap as Record<string, unknown> | undefined
  if (!snap || !Array.isArray(snap.pieces) || snap.pieces.length > MAX_PIECES) return null
  const pieces: SnapPiece[] = []
  for (const raw of snap.pieces) {
    const piece = readPiece(raw)
    if (!piece) return null
    pieces.push(piece)
  }
  const n = pieces.length
  const sticks = readPairs(snap.sticks, n, 5)
  const ties = readPairs(snap.ties, n, 4)
  const wires = readPairs(snap.wires, n, 2)
  const manual = readIndexes(snap.manual, n)
  const free = readIndexes(snap.free, n)
  if (!sticks || !ties || !wires || !manual || !free) return null
  if (sticks.some((s) => s.length < 4) || ties.some((t) => t.length !== 4)) return null
  const unitsH = isNum(d.unitsH) && d.unitsH > 0 ? d.unitsH : undefined
  return {
    ...(unitsH === undefined ? {} : { unitsH }),
    room: { left: room.left, right: room.right, top: room.top },
    snap: {
      pieces,
      sticks: sticks as SandboxSnapshot['sticks'],
      ties: ties as SandboxSnapshot['ties'],
      wires: wires as [number, number][],
      manual,
      free,
    },
  }
}

/**
 * Сохранение сделано при другом «Размере деталей»: пол теперь на другой высоте.
 * Сдвигаем постройку на новый пол; потолок не ниже начального. Старое сохранение без размера — как есть.
 */
export function fitRoomSave(
  save: RoomSave,
  now: { unitsH: number; floorFrac: number; startTop: number },
): RoomSave {
  if (save.unitsH === undefined || save.unitsH === now.unitsH) return save
  const dy = (now.unitsH - save.unitsH) * now.floorFrac
  return {
    unitsH: now.unitsH,
    room: { ...save.room, top: Math.min(save.room.top + dy, now.startTop) },
    snap: {
      ...save.snap,
      pieces: save.snap.pieces.map((p) => ({ ...p, y: p.y + dy })),
      sticks: save.snap.sticks.map((s) => {
        const moved = [...s] as typeof s
        moved[3] = s[3] + dy
        return moved
      }),
    },
  }
}

export function readRoomSave(storage?: StorageLike): RoomSave | null {
  try {
    return parseRoomSave((storage ?? localStorage).getItem(ROOM_SAVE_KEY))
  } catch {
    return null
  }
}

export function writeRoomSave(save: RoomSave, storage?: StorageLike): void {
  try {
    ;(storage ?? localStorage).setItem(
      ROOM_SAVE_KEY,
      JSON.stringify({ v: VERSION, room: save.room, snap: save.snap, unitsH: save.unitsH }),
    )
  } catch {
    // Хранилище переполнено или закрыто (частный режим Safari) — играем без сохранения.
  }
}

export function clearRoomSave(storage?: StorageLike): void {
  try {
    ;(storage ?? localStorage).removeItem(ROOM_SAVE_KEY)
  } catch {
    // См. writeRoomSave.
  }
}
