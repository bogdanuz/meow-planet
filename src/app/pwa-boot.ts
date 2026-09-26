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
async function maybeRegisterServiceWorker(): Promise<void> {
  // В dev SW отключён.
  if (import.meta.env.DEV) return

  // В тестах/JS DOM serviceWorker обычно отсутствует.
  if (typeof navigator === 'undefined') return
  const sw = (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
  if (!sw) return

  try {
    const mod = await import('virtual:pwa-register')
    mod.registerSW()
  } catch {
    // Без offline-кэша приложение всё равно должно оставаться рабочим.
  }
}

export async function runBootSequence(
  report: (progress: BootProgress) => void,
): Promise<void> {
  report({ percent: 0, message: 'Готовим…' })
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
          message: percent >= 100 ? 'Готово!' : 'Готовим…',
        })
      }),
    ),
  )

  // После загрузки boot-ассетов можно регистрировать SW.
  await maybeRegisterServiceWorker()
}

function loadAsset(url: string): Promise<void> {
  if (/\.(mp3|wav|ogg|woff2|ttf)(\?|$)/i.test(url)) {
    return fetch(url, { cache: 'force-cache' }).then(
      () => undefined,
      () => undefined,
    )
  }
  return loadImage(url)
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    const finish = (): void => resolve()
    img.onload = finish
    img.onerror = finish
    img.src = url
  })
}
