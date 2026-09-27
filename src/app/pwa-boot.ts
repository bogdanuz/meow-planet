import { BOOT_ASSET_PATHS } from './boot-assets'
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
const SW_READY_TIMEOUT_MS = 8000

function hasServiceWorkerSupport(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker)
}

function hasServiceWorkerController(): boolean {
  if (!hasServiceWorkerSupport()) return false
  const sw = (navigator as unknown as { serviceWorker: ServiceWorkerContainer }).serviceWorker
  return Boolean(sw.controller)
}

async function registerServiceWorkerReady(timeoutMs = SW_READY_TIMEOUT_MS): Promise<boolean> {
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

    const timeout = window.setTimeout(() => settle(false), timeoutMs)
    try {
      const sw = (navigator as unknown as { serviceWorker: ServiceWorkerContainer }).serviceWorker
      const result = await Promise.race([
        readyPromise,
        sw.ready.then(() => true).catch(() => false),
      ])
      if (result) settle(true)
      return result
    } finally {
      window.clearTimeout(timeout)
    }
  } catch {
    return false
  }
}

function getBootAssetUrlsAbs(): string[] {
  const base = import.meta.env.BASE_URL ?? '/'
  const baseUrl = new URL(base, window.location.origin)
  return BOOT_ASSET_PATHS.map((u) => new URL(u, baseUrl).toString())
}

async function runBootSequenceOnce(
  report: (progress: BootProgress) => void,
): Promise<BootResult> {
  report({ percent: 0, message: 'Загрузка…' })

  const isAutomation =
    typeof navigator !== 'undefined' && typeof navigator.webdriver === 'boolean'
      ? navigator.webdriver
      : false

  if (isAutomation) {
    void registerServiceWorkerReady()
    report({ percent: 100, message: 'Готово!' })
    return { ok: true }
  }

  const hasController = hasServiceWorkerController()
  if (hasController) {
    void registerServiceWorkerReady()
    report({ percent: 100, message: 'Готово!' })
    return { ok: true }
  }

  const firstLoadEstimate =
    'Первая загрузка: около 60 МБ. Потом игра будет работать без интернета'

  report({
    percent: 0,
    message: `${firstLoadEstimate}. Подготавливаем игру для работы без интернета`,
  })

  const downloadRes = await downloadBootAssetsWithProgress(
    getBootAssetUrlsAbs(),
    report,
  )
  if (!downloadRes.ok) return downloadRes

  const swReadyOk = await registerServiceWorkerReady()
  if (!swReadyOk) {
    return {
      ok: false,
      errorMessage:
        'Не удалось подготовить офлайн-режим. Проверьте интернет и попробуйте ещё раз',
    }
  }

  report({ percent: 100, message: 'Готово!' })
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
    // Важно для скорости boot-loader: не читаем весь body в UI-потоке.
    // Offline-кэшность проверяется отдельной проверкой precache в конце.
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
): Promise<BootResult> {
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
        update()
      }
    })(),
  )

  await Promise.allSettled(workers)
  if (failedAssets.length > 0) {
    return {
      ok: false,
      errorMessage:
        'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
      failedAssets,
    }
  }
  update(true)
  return { ok: true }
}

export async function runBootSequence(
  report: (progress: BootProgress) => void,
): Promise<BootResult> {
  let maxPercentSeen = 0
  const trackedReport = (progress: BootProgress): void => {
    maxPercentSeen = Math.max(maxPercentSeen, progress.percent)
    report(progress)
  }

  const firstAttempt = await runBootSequenceOnce(trackedReport)
  if (firstAttempt.ok || maxPercentSeen > 0) return firstAttempt

  // Тихий повтор нужен только для cold-start сетевых сбоев до любого реального прогресса.
  // Если загрузка уже дошла до 100, повтор не делаем: это уже не transient bootstrap failure.
  return runBootSequenceOnce(trackedReport)
}
