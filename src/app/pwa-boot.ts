export type BootProgress = {
  percent: number
  message: string
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
const PRECACHE_MANIFEST_FILE = 'precache-manifest.json'

type RuntimePrecacheManifest = {
  version: 1
  urls: string[]
}

type DownloadResult =
  | { ok: true; totalCount: number }
  | { ok: false; errorMessage: string; failedAssets: string[] }

export type BootDependencies = {
  waitForServiceWorkerReady?: () => Promise<boolean>
}

function hasServiceWorkerSupport(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker)
}

function hasServiceWorkerController(): boolean {
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

async function runBootSequenceOnce(
  report: (progress: BootProgress) => void,
  dependencies: Required<BootDependencies>,
): Promise<BootResult> {
  report({ percent: 0, message: 'Загрузка…' })

  const hasController = hasServiceWorkerController()
  if (hasController) {
    const swReady = await waitForServiceWorkerFinalization(
      dependencies.waitForServiceWorkerReady(),
    )
    if (!swReady) {
      return {
        ok: false,
        errorMessage:
          'Не удалось подготовить офлайн-режим. Проверьте интернет и попробуйте ещё раз',
      }
    }
    report({ percent: 100, message: 'Готово!' })
    return { ok: true }
  }

  const firstLoadEstimate =
    'Первая загрузка: около 60 МБ. Потом игра будет работать без интернета'

  report({
    percent: 0,
    message: `${firstLoadEstimate}. Подготавливаем игру для работы без интернета`,
  })

  // Регистрация и проверка полного Workbox-списка идут параллельно. Финальные
  // 100% публикуются только когда завершились обе части одного precache.
  const swReadyPromise = dependencies.waitForServiceWorkerReady()
  let urlsAbs: string[]
  try {
    urlsAbs = await loadPrecacheUrls()
  } catch {
    return {
      ok: false,
      errorMessage:
        'Не удалось подготовить офлайн-режим. Проверьте интернет и попробуйте ещё раз',
    }
  }

  const downloadRes = await downloadBootAssetsWithProgress(urlsAbs, report)
  if (!downloadRes.ok) return downloadRes

  const swReadyOk = await waitForServiceWorkerFinalization(swReadyPromise)
  if (!swReadyOk) {
    return {
      ok: false,
      errorMessage:
        'Не удалось подготовить офлайн-режим. Проверьте интернет и попробуйте ещё раз',
    }
  }

  report({
    percent: 100,
    message: `Подготавливаем игру для работы без интернета. Проверено файлов: ${downloadRes.totalCount} из ${downloadRes.totalCount}`,
  })
  return { ok: true }
}

async function fetchWithByteProgress(
  url: string,
  onContentLengthBytes: ((contentLengthBytes: number) => void) | undefined,
  timeoutMs: number,
): Promise<
  | { ok: true; contentLengthBytes: number | null }
  | { ok: false; contentLengthBytes: number | null }
> {
  const controller = new AbortController()
  const t = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { cache: 'force-cache', signal: controller.signal })
    if (!resp.ok) return { ok: false, contentLengthBytes: null }
    const contentLengthHeader = resp.headers.get('content-length')
    const parsedContentLength =
      contentLengthHeader != null ? Number(contentLengthHeader) : null
    const contentLengthBytes =
      parsedContentLength != null &&
      Number.isFinite(parsedContentLength) &&
      parsedContentLength > 0
        ? parsedContentLength
        : null
    if (contentLengthBytes != null) onContentLengthBytes?.(contentLengthBytes)
    // fetch() резолвится после заголовков. Пока body не дочитан, Safari может
    // держать соединение занятым и Workbox install останется ждать сеть.
    await resp.arrayBuffer()
    return { ok: true, contentLengthBytes }
  } catch {
    return { ok: false, contentLengthBytes: null }
  } finally {
    window.clearTimeout(t)
  }
}

async function downloadBootAssetsWithProgress(
  urlsAbs: string[],
  report: (progress: BootProgress) => void,
): Promise<DownloadResult> {
  const totalCount = urlsAbs.length || 1
  let doneCount = 0
  const failedAssets: string[] = []

  let lastReportAt = 0
  const update = (force = false) => {
    const now = Date.now()
    if (!force && now - lastReportAt < 90) return
    lastReportAt = now

    const pct = Math.max(0, Math.min(100, Math.round((doneCount / totalCount) * 100)))
    const verifiedText = `Проверено файлов: ${doneCount} из ${totalCount}`
    report({
      percent: pct,
      message: `Подготавливаем игру для работы без интернета. ${verifiedText}`,
    })
  }

  update(true)

  const timeoutMsPerAsset = 16_000
  const concurrency = 4
  let idx = 0
  const workers = Array.from({ length: concurrency }, () =>
    (async () => {
      while (idx < urlsAbs.length) {
        const url = urlsAbs[idx++]
        const res = await fetchWithByteProgress(
          url,
          undefined,
          timeoutMsPerAsset,
        )

        if (res.ok) {
          doneCount += 1
        } else {
          failedAssets.push(url)
        }
        // Не показываем финальные 100% раньше lifecycle-сигнала Workbox.
        if (doneCount < totalCount) update()
      }
    })(),
  )

  await Promise.allSettled(workers)
  if (failedAssets.length > 0) {
    if (doneCount > 0) update(true)
    return {
      ok: false,
      errorMessage:
        'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
      failedAssets,
    }
  }
  return { ok: true, totalCount }
}

export async function runBootSequence(
  report: (progress: BootProgress) => void,
  dependencies: BootDependencies = {},
): Promise<BootResult> {
  const resolvedDependencies: Required<BootDependencies> = {
    waitForServiceWorkerReady:
      dependencies.waitForServiceWorkerReady ?? registerServiceWorkerReady,
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
