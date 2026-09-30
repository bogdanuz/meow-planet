import { isLegacyCreativeRecord, parseCreativeWork, type CreativeWork } from './creative-works'

export type CreativeRepository = {
  list(): Promise<CreativeWork[]>
  put(work: CreativeWork): Promise<void>
  remove(id: string): Promise<void>
  putBlob(id: string, blob: Blob): Promise<void>
  getBlob(id: string): Promise<Blob | null>
  removeBlob(id: string): Promise<void>
}

type StoredBlob = { id: string; blob: Blob }

const DB_NAME = 'meow-planet-creative'
const DB_VERSION = 1
const WORKS = 'works'
const BLOBS = 'blobs'

export function createMemoryCreativeRepository(
  initial: readonly CreativeWork[] = [],
): CreativeRepository {
  const works = new Map(initial.map((work) => [work.id, structuredCloneWork(work)]))
  const blobs = new Map<string, Blob>()
  return {
    async list() {
      return [...works.values()].map(structuredCloneWork)
    },
    async put(work) {
      works.set(work.id, structuredCloneWork(work))
    },
    async remove(id) {
      works.delete(id)
    },
    async putBlob(id, blob) {
      blobs.set(id, blob)
    },
    async getBlob(id) {
      return blobs.get(id) ?? null
    },
    async removeBlob(id) {
      blobs.delete(id)
    },
  }
}

function structuredCloneWork(work: CreativeWork): CreativeWork {
  return {
    ...work,
    strokes: work.strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point })),
    })),
    background: { ...work.background },
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(WORKS)) db.createObjectStore(WORKS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: 'id' })
    }
  })
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IDB request failed'))
  })
}

export function createIdbCreativeRepository(): CreativeRepository {
  return {
    async list() {
      const db = await openDb()
      try {
        const rows = (await idbReq(
          db.transaction(WORKS, 'readonly').objectStore(WORKS).getAll(),
        )) as unknown[]
        const legacy = rows.filter(isLegacyCreativeRecord) as { id?: unknown }[]
        if (legacy.length > 0) {
          const tx = db.transaction([WORKS, BLOBS], 'readwrite')
          for (const row of legacy) {
            if (typeof row.id !== 'string') continue
            tx.objectStore(WORKS).delete(row.id)
            tx.objectStore(BLOBS).delete(`thumb-${row.id}`)
          }
          await new Promise<void>((resolve) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
            tx.onabort = () => resolve()
          })
        }
        return rows
          .map(parseCreativeWork)
          .filter((work): work is CreativeWork => work !== null)
      } finally {
        db.close()
      }
    },
    async put(work) {
      const db = await openDb()
      try {
        await idbReq(db.transaction(WORKS, 'readwrite').objectStore(WORKS).put(work))
      } finally {
        db.close()
      }
    },
    async remove(id) {
      const db = await openDb()
      try {
        await idbReq(db.transaction(WORKS, 'readwrite').objectStore(WORKS).delete(id))
      } finally {
        db.close()
      }
    },
    async putBlob(id, blob) {
      const db = await openDb()
      try {
        const row: StoredBlob = { id, blob }
        await idbReq(db.transaction(BLOBS, 'readwrite').objectStore(BLOBS).put(row))
      } finally {
        db.close()
      }
    },
    async getBlob(id) {
      const db = await openDb()
      try {
        const row = (await idbReq(
          db.transaction(BLOBS, 'readonly').objectStore(BLOBS).get(id),
        )) as StoredBlob | undefined
        return row?.blob ?? null
      } finally {
        db.close()
      }
    },
    async removeBlob(id) {
      const db = await openDb()
      try {
        await idbReq(db.transaction(BLOBS, 'readwrite').objectStore(BLOBS).delete(id))
      } finally {
        db.close()
      }
    },
  }
}

let testRepository: CreativeRepository | null = null
let memoryRepository: CreativeRepository | null = null
let idbRepository: CreativeRepository | null = null

export function setCreativeRepositoryForTests(repository: CreativeRepository | null): void {
  testRepository = repository
}

export function getCreativeRepository(): CreativeRepository {
  if (testRepository) return testRepository
  if (typeof indexedDB === 'undefined') {
    memoryRepository ??= createMemoryCreativeRepository()
    return memoryRepository
  }
  idbRepository ??= createIdbCreativeRepository()
  return idbRepository
}
