/**
 * Локальные фото для пазла (IndexedDB). Без камеры и облака.
 * Кадрирование: альбом **4:3** (960×720 JPEG).
 */

import {
  initialCoverPan,
  PUZZLE_LANDSCAPE_HEIGHT,
  PUZZLE_LANDSCAPE_WIDTH,
  sourceRectFromPan,
  type CoverPan,
} from './puzzle-crop-math'

const DB_NAME = 'meow-planet-puzzles'
const STORE = 'photos'
const DB_VERSION = 1

export type PuzzlePhotoMeta = {
  id: string
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IDB request failed'))
  })
}

export async function cropBitmapToLandscape4x3(
  bitmap: ImageBitmap,
  pan: CoverPan,
): Promise<Blob> {
  const { sx, sy, sw, sh } = sourceRectFromPan(pan, bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = PUZZLE_LANDSCAPE_WIDTH
  canvas.height = PUZZLE_LANDSCAPE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D недоступен')
  }
  ctx.drawImage(
    bitmap,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    PUZZLE_LANDSCAPE_WIDTH,
    PUZZLE_LANDSCAPE_HEIGHT,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('toBlob failed'))
      },
      'image/jpeg',
      0.9,
    )
  })
}

/** Центр-cover → 4:3 (для тестов и быстрого пути). */
export async function cropImageFileToLandscape4x3(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const pan = initialCoverPan(bitmap.width, bitmap.height, 400, 300)
  try {
    return await cropBitmapToLandscape4x3(bitmap, pan)
  } finally {
    bitmap.close()
  }
}

export async function savePuzzlePhotoFromBitmap(
  bitmap: ImageBitmap,
  pan: CoverPan,
): Promise<PuzzlePhotoMeta> {
  const blob = await cropBitmapToLandscape4x3(bitmap, pan)
  bitmap.close()
  return savePuzzlePhotoBlob(blob)
}

export async function savePuzzlePhoto(file: File): Promise<PuzzlePhotoMeta> {
  const blob = await cropImageFileToLandscape4x3(file)
  return savePuzzlePhotoBlob(blob)
}

export async function savePuzzlePhotoBlob(blob: Blob): Promise<PuzzlePhotoMeta> {
  const meta: PuzzlePhotoMeta & { blob: Blob } = {
    id: `puzzle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    blob,
  }
  const db = await openDb()
  try {
    await idbReq(db.transaction(STORE, 'readwrite').objectStore(STORE).put(meta))
  } finally {
    db.close()
  }
  return { id: meta.id, createdAt: meta.createdAt }
}

export async function listPuzzlePhotos(): Promise<PuzzlePhotoMeta[]> {
  const db = await openDb()
  try {
    const rows = await idbReq(
      db.transaction(STORE, 'readonly').objectStore(STORE).getAll(),
    )
    return (rows as Array<PuzzlePhotoMeta>)
      .map((row) => ({ id: row.id, createdAt: row.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    db.close()
  }
}

export async function getPuzzlePhotoBlob(id: string): Promise<Blob | null> {
  const db = await openDb()
  try {
    const row = (await idbReq(
      db.transaction(STORE, 'readonly').objectStore(STORE).get(id),
    )) as { blob?: Blob } | undefined
    return row?.blob ?? null
  } finally {
    db.close()
  }
}

export async function deletePuzzlePhoto(id: string): Promise<void> {
  const db = await openDb()
  try {
    await idbReq(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id))
  } finally {
    db.close()
  }
}

/** Только файловый ввод — без capture/камеры. */
export function createPuzzleFileInput(): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/webp'
  input.multiple = false
  // Не ставим capture — камера запрещена продуктом
  return input
}
