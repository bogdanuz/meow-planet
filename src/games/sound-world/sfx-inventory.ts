const BASE = `${import.meta.env.BASE_URL ?? '/'}assets/games/sound-world/sfx/inventory.json`
const FILES = `${import.meta.env.BASE_URL ?? '/'}assets/games/sound-world/sfx/sfx-files.json`

let cached: Set<string> | null = null

/** Имена файлов без расширения — только карточки с реальным sfx (S14 v2). */
export async function loadSfxInventory(): Promise<Set<string>> {
  if (cached) return cached
  try {
    const res = await fetch(BASE, { cache: 'no-cache' })
    if (res.ok) {
      const list = (await res.json()) as string[]
      cached = new Set(list)
      return cached
    }
  } catch {
    // offline
  }
  cached = new Set()
  return cached
}

let extCached: Record<string, string> | null = null

/** id → расширение файла. Один запрос списка, без проверки каждого звука. */
export async function loadSfxExtensions(): Promise<Record<string, string>> {
  if (extCached) return extCached
  try {
    const res = await fetch(FILES, { cache: 'no-cache' })
    if (res.ok) {
      extCached = (await res.json()) as Record<string, string>
      return extCached
    }
  } catch {
    // offline
  }
  extCached = {}
  return extCached
}

export function resetSfxInventoryCacheForTests(): void {
  cached = null
  extCached = null
}
