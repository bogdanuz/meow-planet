/**
 * Локальные фото для пазла (IndexedDB). Без камеры и облака.
 * Кадр 4:3 готовит общий редактор `photo-crop-editor`.
 */

const DB_NAME = 'meow-planet-puzzles'
const STORE = 'photos'
const DB_VERSION = 1

export const PUZZLE_PHOTO_TITLE_MAX = 24
const DEFAULT_TITLE = 'Моё фото'

export type PuzzlePhotoMeta = {
  id: string
  createdAt: number
  title: string
}

type PuzzlePhotoRow = { id: string; createdAt: number; title?: string; blob?: Blob }

/** Подпись взрослого: одна строка, без служебных символов, не длиннее предела. */
export function sanitizePhotoTitle(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PUZZLE_PHOTO_TITLE_MAX)
    .trim()
}

/** «Моё фото N» с первым свободным номером. */
export function defaultPhotoTitle(existing: readonly string[]): string {
  const taken = new Set(existing)
  let n = 1
  while (taken.has(`${DEFAULT_TITLE} ${n}`)) n += 1
  return `${DEFAULT_TITLE} ${n}`
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

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
  })
}

export async function savePuzzlePhotoBlob(blob: Blob, title = ''): Promise<PuzzlePhotoMeta> {
  const row: PuzzlePhotoRow & PuzzlePhotoMeta = {
    id: `puzzle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    title: sanitizePhotoTitle(title),
    blob,
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(row)
    await txDone(tx)
  } finally {
    db.close()
  }
  return { id: row.id, createdAt: row.createdAt, title: row.title }
}

/** Свои фото, новые первыми. */
export async function listPuzzlePhotos(): Promise<PuzzlePhotoMeta[]> {
  const db = await openDb()
  try {
    const rows = await idbReq(
      db.transaction(STORE, 'readonly').objectStore(STORE).getAll(),
    )
    return (rows as PuzzlePhotoRow[])
      .map((row) => ({ id: row.id, createdAt: row.createdAt, title: sanitizePhotoTitle(row.title ?? '') }))
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
    )) as PuzzlePhotoRow | undefined
    return row?.blob ?? null
  } finally {
    db.close()
  }
}

/** Удалить выбранные фото (галерея пазла: «Выбрать» → «Удалить»). */
export async function deletePuzzlePhotos(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const id of ids) store.delete(id)
    await txDone(tx)
  } finally {
    db.close()
  }
}

export async function clearPuzzlePhotos(): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    await txDone(tx)
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
