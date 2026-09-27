const EXTENSIONS = ['ogg', 'mp3', 'wav'] as const

export function sfxAssetBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/sound-world/sfx/`
}

/**
 * Workbox precache (`dist/sw.js`) матчится по URL-строке с "живыми" unicode-именами файлов.
 * Поэтому в runtime-URL нельзя делать percent-encoding (например `%D0%90` вместо `А`) — иначе
 * Service Worker не найдёт ключ в Cache Storage.
 */
export function buildSfxFileUrl(sfxBase: string, ext: (typeof EXTENSIONS)[number]): string {
  return `${sfxAssetBaseUrl()}${sfxBase}.${ext}`
}

export function isAudioContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const ct = contentType.toLowerCase()
  if (ct.includes('text/html')) return false
  return (
    ct.startsWith('audio/') ||
    ct.includes('ogg') ||
    ct.includes('mpeg') ||
    ct.includes('wav')
  )
}

/** Адрес из статического списка расширений. Без сетевых HEAD. */
export function buildKnownSfxUrls(
  ids: Iterable<string>,
  extById: Readonly<Record<string, string>>,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const id of ids) {
    const ext = extById[id]
    if (ext !== 'ogg' && ext !== 'mp3' && ext !== 'wav') continue
    map.set(id, buildSfxFileUrl(id, ext))
  }
  return map
}
