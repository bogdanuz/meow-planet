export type BootProgress = {
  percent: number
  message: string
  doneCount?: number
  totalCount?: number
}

export type BootResult =
  | { ok: true }
  | { ok: false; errorMessage: string; failedAssets?: string[] }

/**
 * Шкала 0–100 по фактической загрузке картинок и звуков готовых игр.
 * Welcome показывается только после этого списка.
 */
/**
 * `vite-plugin-pwa` настроен на `injectRegister: false`,
 * поэтому регистрация Service Worker должна происходить из приложения.
 */
const SW_FINALIZE_TIMEOUT_MS = 60_000
const MANIFEST_TIMEOUT_MS = 8000
const CACHE_POLL_INTERVAL_MS = 120
const CACHE_FINALIZATION_MAX_POLLS = 50
const PRECACHE_MANIFEST_FILE = 'precache-manifest.json'

type RuntimePrecacheManifest = {
  version: 1
  urls: string[]
}

export type BootDependencies = {
  isDevelopment?: boolean
  waitForServiceWorkerReady?: () => Promise<boolean>
  readWorkboxCachedUrls?: () => Promise<Set<string>>
  waitForNextCachePoll?: () => Promise<void>
}

function hasServiceWorkerSupport(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker)
}

export function hasActiveServiceWorkerController(): boolean {
  if (!hasServiceWorkerSupport()) return false
  const sw = (navigator as unknown as { serviceWorker: ServiceWorkerContainer }).serviceWorker
  return Boolean(sw.controller)
}

async function registerServiceWorkerReady(): Promise<boolean> {
  if (import.meta.env.DEV) return true
  if (!hasServiceWorkerSupport()) return false

  try {
    const mod = await import('virtual:pwa-register')
    let settled = false
    let resolveReady!: (value: boolean) => void
    const readyPromise = new Promise<boolean>((resolve) => {
      resolveReady = resolve
    })
    const settle = (value: boolean): void => {
      if (settled) return
      settled = true
      resolveReady(value)
    }

    mod.registerSW({
      immediate: true,
      onOfflineReady: () => settle(true),
      onRegisterError: () => settle(false),
    })

    const sw = (navigator as unknown as { serviceWorker: ServiceWorkerContainer }).serviceWorker
    const result = await Promise.race([
      readyPromise,
      sw.ready.then(() => true).catch(() => false),
    ])
    if (result) settle(true)
    return result
  } catch {
    return false
  }
}

async function waitForServiceWorkerFinalization(
  readiness: Promise<boolean>,
): Promise<boolean> {
  let timeout: number | undefined
  try {
    return await Promise.race([
      readiness,
      new Promise<boolean>((resolve) => {
        timeout = window.setTimeout(
          () => resolve(false),
          SW_FINALIZE_TIMEOUT_MS,
        )
      }),
    ])
  } finally {
    if (timeout != null) window.clearTimeout(timeout)
  }
}

function getAppUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const baseUrl = new URL(base, window.location.origin)
  return new URL(path, baseUrl).toString()
}

async function loadPrecacheUrls(): Promise<string[]> {
  const controller = new AbortController()
  const timeout = window.setTimeout(
    () => controller.abort(),
    MANIFEST_TIMEOUT_MS,
  )
  try {
    const response = await fetch(getAppUrl(PRECACHE_MANIFEST_FILE), {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Precache manifest request failed')

    const manifest = (await response.json()) as Partial<RuntimePrecacheManifest>
    if (
      manifest.version !== 1 ||
      !Array.isArray(manifest.urls) ||
      manifest.urls.length === 0 ||
      manifest.urls.some((url) => typeof url !== 'string' || url.length === 0)
    ) {
      throw new Error('Invalid precache manifest')
    }

    return [...new Set(manifest.urls)].map(getAppUrl)
  } finally {
    window.clearTimeout(timeout)
  }
}

function normalizePrecacheUrl(value: string): string {
  const url = new URL(value, window.location.href)
  url.searchParams.delete('__WB_REVISION__')
  url.hash = ''
  return url.toString()
}

async function readWorkboxCachedUrls(): Promise<Set<string>> {
  const cachedUrls = new Set<string>()
  const cacheNames = await caches.keys()
  const workboxCacheNames = cacheNames.filter((name) =>
    name.includes('workbox-precache'),
  )

  for (const cacheName of workboxCacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    for (const request of requests) {
      cachedUrls.add(normalizePrecacheUrl(request.url))
    }
  }
  return cachedUrls
}

function waitForNextCachePoll(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, CACHE_POLL_INTERVAL_MS)
  })
}

async function trackWorkboxPrecacheProgress(
  urlsAbs: string[],
  readiness: Promise<boolean>,
  report: (progress: BootProgress) => void,
  dependencies: Required<BootDependencies>,
): Promise<boolean> {
  const expectedUrls = urlsAbs.map(normalizePrecacheUrl)
  const totalCount = expectedUrls.length
  let readinessState: boolean | undefined
  let previousCount = -1
  let finalizationPolls = 0

  void readiness.then(
    (ready) => {
      readinessState = ready
    },
    () => {
      readinessState = false
    },
  )

  while (true) {
    let cachedUrls: Set<string>
    try {
      cachedUrls = await dependencies.readWorkboxCachedUrls()
    } catch {
      return false
    }
    const doneCount = expectedUrls.reduce(
      (count, url) => count + (cachedUrls.has(url) ? 1 : 0),
      0,
    )

    if (doneCount !== previousCount) {
      previousCount = doneCount
      report({
        percent: Math.min(99, Math.round((doneCount / totalCount) * 100)),
        message: 'Подготавливаем игру',
        doneCount,
        totalCount,
      })
    }

    if (readinessState === true && doneCount === totalCount) {
      report({
        percent: 100,
        message: 'Все файлы готовы',
        doneCount: totalCount,
        totalCount,
      })
      return true
    }

    if (readinessState === false) return false
    if (readinessState === true) {
      finalizationPolls += 1
      if (finalizationPolls >= CACHE_FINALIZATION_MAX_POLLS) return false
    }
    await dependencies.waitForNextCachePoll()
  }
}

async function runBootSequenceOnce(
  report: (progress: BootProgress) => void,
  dependencies: Required<BootDependencies>,
): Promise<BootResult> {
  const hasController = hasActiveServiceWorkerController()
  if (hasController) {
    const swReady = await waitForServiceWorkerFinalization(
      dependencies.waitForServiceWorkerReady(),
    )
    if (!swReady) {
      return {
        ok: false,
        errorMessage:
          'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
      }
    }
    report({ percent: 100, message: 'Готово!' })
    return { ok: true }
  }

  // Manifest задаёт ожидаемый набор, а промежуточный счёт берётся только из
  // фактических записей Workbox Cache Storage. Второй download-pass не нужен.
  const swReadyPromise = waitForServiceWorkerFinalization(
    dependencies.waitForServiceWorkerReady(),
  )
  let urlsAbs: string[]
  try {
    urlsAbs = await loadPrecacheUrls()
  } catch {
    return {
      ok: false,
      errorMessage:
        'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
    }
  }

  // vite-plugin-pwa выключен на dev-server, поэтому Cache Storage там не
  // создаётся. Это только локальный UI-путь; production всегда идёт ниже через
  // наблюдение реального workbox-precache и отдельный preview e2e.
  if (dependencies.isDevelopment) {
    const swReadyOk = await swReadyPromise
    if (!swReadyOk) {
      return {
        ok: false,
        errorMessage:
          'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
      }
    }
    report({
      percent: 100,
      message: 'Все файлы готовы',
      doneCount: urlsAbs.length,
      totalCount: urlsAbs.length,
    })
    return { ok: true }
  }

  const swReadyOk = await trackWorkboxPrecacheProgress(
    urlsAbs,
    swReadyPromise,
    report,
    dependencies,
  )
  if (!swReadyOk) {
    return {
      ok: false,
      errorMessage:
        'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
    }
  }

  return { ok: true }
}

export async function runBootSequence(
  report: (progress: BootProgress) => void,
  dependencies: BootDependencies = {},
): Promise<BootResult> {
  const resolvedDependencies: Required<BootDependencies> = {
    isDevelopment: dependencies.isDevelopment ?? import.meta.env.DEV,
    waitForServiceWorkerReady:
      dependencies.waitForServiceWorkerReady ?? registerServiceWorkerReady,
    readWorkboxCachedUrls:
      dependencies.readWorkboxCachedUrls ?? readWorkboxCachedUrls,
    waitForNextCachePoll:
      dependencies.waitForNextCachePoll ?? waitForNextCachePoll,
  }
  let maxPercentSeen = 0
  const trackedReport = (progress: BootProgress): void => {
    maxPercentSeen = Math.max(maxPercentSeen, progress.percent)
    report(progress)
  }

  const firstAttempt = await runBootSequenceOnce(
    trackedReport,
    resolvedDependencies,
  )
  if (firstAttempt.ok || maxPercentSeen > 0) return firstAttempt

  // Тихий повтор нужен только для cold-start сетевых сбоев до любого реального прогресса.
  // Если загрузка уже дошла до 100, повтор не делаем: это уже не transient bootstrap failure.
  return runBootSequenceOnce(trackedReport, resolvedDependencies)
}
