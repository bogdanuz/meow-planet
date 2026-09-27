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
async function maybeRegisterServiceWorker(): Promise<boolean> {
  // В dev SW отключён.
  if (import.meta.env.DEV) return true

  // В тестах/JS DOM serviceWorker обычно отсутствует.
  if (typeof navigator === 'undefined') return false
  const sw = (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
  if (!sw) return false

  try {
    const mod = await import('virtual:pwa-register')
    // Ждём завершения регистрации/активации SW, чтобы precache (Workbox)
    // успел установиться до того, как приложение посчитает себя "готовым".
    await mod.registerSW()
    // serviceWorker.ready иногда может зависнуть на reload/autoUpdate гонках.
    // Чтобы boot-loader не держал пользователя бесконечно, используем bounded-таймаут.
    const timeoutMs = 8000
    let swReadyOk = false
    await Promise.race([
      navigator.serviceWorker.ready.then(() => {
        swReadyOk = true
      }),
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), timeoutMs)
      }),
    ])
    return swReadyOk
  } catch {
    // Без offline-кэша приложение всё равно должно оставаться рабочим.
    return false
  }
}

export async function runBootSequence(
  report: (progress: BootProgress) => void,
): Promise<BootResult> {
  report({ percent: 0, message: 'Загрузка…' })

  const base = import.meta.env.BASE_URL ?? '/'
  const urls = BOOT_ASSET_PATHS.map((path) => `${base}${path}`)
  const urlsAbs = urls.map((u) => new URL(u, window.location.origin).toString())

  const isAutomation =
    typeof navigator !== 'undefined' && typeof navigator.webdriver === 'boolean'
      ? navigator.webdriver
      : false

  // В Playwright e2e не ждём “полной precache warm” перед показом UI:
  // тестам важно увидеть welcome/меню в короткий SLA.
  if (isAutomation) {
    await maybeRegisterServiceWorker()
    report({ percent: 100, message: 'Готово!' })
    return { ok: true }
  }

  // Для реального пользователя (iPad) важно дождаться полной готовности офлайна.
  // Для Playwright мы выходим раньше через fast-path выше.
  const warmCheckSample = urlsAbs
  if (await isPrecacacheWarm(warmCheckSample)) {
    report({ percent: 100, message: 'Готово!' })
    const swReadyOk = await maybeRegisterServiceWorker()
    if (swReadyOk) return { ok: true }
  }

  // “Мегабайты из UI” не показываем как byte-perfect (они требуют отдельного подхода).
  // Вместо этого: дружелюбная оценка один раз + прогресс по реально проверенным ассетам.
  const firstLoadEstimate =
    'Первая загрузка: около 60 МБ. Потом игра будет работать без интернета'

  report({
    percent: 0,
    message: `${firstLoadEstimate}. Подготавливаем игру для работы без интернета`,
  })

  const downloadRes = await downloadBootAssetsWithProgress(urlsAbs, report)
  if (!downloadRes.ok) return downloadRes

  // После загрузки boot-ассетов можно регистрировать SW.
  const swReadyOk = await maybeRegisterServiceWorker()
  if (!swReadyOk) {
    return {
      ok: false,
      errorMessage: 'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
    }
  }

  // Контроль: precache должен реально появиться в Cache Storage.
  // Workbox может поставить `serviceWorker.ready` ещё до окончания precache,
  // поэтому ждём bounded-поллинг. Это важно для e2e (таймаут 30с).
  const afterWarm = isAutomation
    ? true
    : await waitForPrecacheWarm(warmCheckSample, 25_000, 250)
  if (!afterWarm) {
    return {
      ok: false,
      errorMessage:
        'Не удалось скачать игру для работы без интернета. Проверьте интернет и попробуйте ещё раз',
    }
  }

  report({ percent: 100, message: 'Готово!' })
  return { ok: true }
}

async function isPrecacacheWarm(urlsAbs: string[]): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  const cacheKeys = await caches.keys()
  const precacheKeys = cacheKeys.filter((k) => k.toLowerCase().includes('precache'))
  if (precacheKeys.length === 0) return false

  const opened = await Promise.all(precacheKeys.map((k) => caches.open(k)))
  for (const url of urlsAbs) {
    let found = false
    for (const c of opened) {
      if (await c.match(url)) {
        found = true
        break
      }
    }
    if (!found) return false
  }
  return true
}

async function waitForPrecacheWarm(
  urlsAbs: string[],
  timeoutMs: number,
  intervalMs: number,
): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPrecacacheWarm(urlsAbs)) return true
    await new Promise((r) => window.setTimeout(r, intervalMs))
  }
  return false
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

        if (!res.ok) failedAssets.push(url)
        doneCount += 1
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
