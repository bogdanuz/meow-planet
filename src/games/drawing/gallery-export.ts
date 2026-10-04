import { downloadBlob } from '../../shared/download-blob'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

export type ShareDeps = {
  canShare?: (data: { files: File[] }) => boolean
  share?: (data: { files: File[] }) => Promise<void>
  download?: (file: File) => void
  wait?: (ms: number) => Promise<void>
}

export function drawingsWord(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'рисунок'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'рисунка'
  return 'рисунков'
}

export function uniqueFileNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1
    seen.set(name, count)
    if (count === 1) return name
    const dot = name.lastIndexOf('.')
    return dot > 0 ? `${name.slice(0, dot)}_${count}${name.slice(dot)}` : `${name}_${count}`
  })
}

/** Наклон плитки на доске в градусах: от id, чтобы не прыгал при перерисовке. */
export function cardTilt(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return ((Math.abs(hash) % 9) - 4) * 0.5
}

function defaultDeps(): Required<ShareDeps> {
  return {
    canShare: (data) => typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare(data),
    share: (data) => navigator.share(data),
    download: (file) => downloadBlob(file, file.name),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }
}

/** iPad: одно окно «Поделиться» со всеми файлами; иначе — отдельные файлы по очереди. */
export async function shareOrDownload(files: readonly File[], deps: ShareDeps = {}): Promise<ShareResult> {
  if (files.length === 0) return 'cancelled'
  const { canShare, share, download, wait } = { ...defaultDeps(), ...deps }
  const list = [...files]
  if (canShare({ files: list })) {
    try {
      await share({ files: list })
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    }
  }
  for (const [index, item] of list.entries()) {
    if (index > 0) await wait(350)
    download(item)
  }
  return 'downloaded'
}
