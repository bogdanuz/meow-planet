/**
 * Фото построек «Собери что угодно!» (IndexedDB, только на устройстве).
 * Снимок делает сама игра с холста; камеры нет.
 */

const DB_NAME = 'meow-planet-sandbox'
const STORE = 'photos'
const DB_VERSION = 1
/** Больше — самые старые уходят, чтобы память планшета не забивалась. */
export const SANDBOX_PHOTO_MAX = 60

export type SandboxPhotoMeta = { id: string; createdAt: number }

type Row = SandboxPhotoMeta & { blob?: Blob }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
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

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, mode)
    const result = await run(tx.objectStore(STORE))
    if (mode === 'readwrite') await txDone(tx)
    return result
  } finally {
    db.close()
  }
}

/** Новые первыми. */
export async function listSandboxPhotos(): Promise<SandboxPhotoMeta[]> {
  const rows = await withStore('readonly', (store) => idbReq(store.getAll()) as Promise<Row[]>)
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt })).sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveSandboxPhoto(blob: Blob): Promise<SandboxPhotoMeta> {
  const meta: SandboxPhotoMeta = {
    id: `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  await withStore('readwrite', async (store) => {
    store.put({ ...meta, blob } satisfies Row)
  })
  const all = await listSandboxPhotos()
  if (all.length > SANDBOX_PHOTO_MAX) await deleteSandboxPhotos(all.slice(SANDBOX_PHOTO_MAX).map((p) => p.id))
  return meta
}

export async function getSandboxPhotoBlob(id: string): Promise<Blob | null> {
  const row = await withStore('readonly', (store) => idbReq(store.get(id)) as Promise<Row | undefined>)
  return row?.blob ?? null
}

export async function deleteSandboxPhotos(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return
  await withStore('readwrite', async (store) => {
    for (const id of ids) store.delete(id)
  })
}

export async function clearSandboxPhotos(): Promise<void> {
  await withStore('readwrite', async (store) => {
    store.clear()
  })
}
