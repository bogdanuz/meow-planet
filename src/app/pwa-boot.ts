import { BOOT_ASSET_PATHS } from './boot-assets'

export type BootProgress = {
  percent: number
  message: string
}

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
): Promise<void> {
  report({ percent: 0, message: 'Загрузка…' })
  const base = import.meta.env.BASE_URL ?? '/'
  const urls = BOOT_ASSET_PATHS.map((path) => `${base}${path}`)
  let done = 0
  const total = urls.length || 1

  await Promise.all(
    urls.map((url) =>
      loadAsset(url).then(() => {
        done += 1
        const percent = Math.round((done / total) * 100)
        report({
          percent,
          // "Готово!" покажем после того, как SW тоже дошёл до готовности.
          message: 'Загрузка…',
        })
      }),
    ),
  )

  // После загрузки boot-ассетов можно регистрировать SW.
  const swReadyOk = await maybeRegisterServiceWorker()
  report({ percent: 100, message: swReadyOk ? 'Готово!' : 'Загрузка…' })
}

function loadAsset(url: string): Promise<void> {
  if (/\.(mp3|wav|ogg|woff2|ttf)(\?|$)/i.test(url)) {
    // Плохие/зависшие запросы не должны держать boot-loader бесконечно.
    const controller = new AbortController()
    const timeoutMs = 12_000
    const t = window.setTimeout(() => controller.abort(), timeoutMs)
    return fetch(url, { cache: 'force-cache', signal: controller.signal })
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => window.clearTimeout(t))
  }
  return loadImage(url)
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      resolve()
    }
    const timeoutMs = 12_000
    const t = window.setTimeout(finish, timeoutMs)
    img.onload = () => {
      window.clearTimeout(t)
      finish()
    }
    img.onerror = () => {
      window.clearTimeout(t)
      finish()
    }
    img.src = url
  })
}
