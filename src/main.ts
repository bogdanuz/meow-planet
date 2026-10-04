import './styles/global.css'
import './styles/placeholders.css'
import './styles/game-stub.css'
import './styles/game-common.css'
import './styles/shell.css'
import './styles/parent.css'
import { mountBootLoader, type BootLoaderHandle } from './app/boot-loader'
import { installFullHeight } from './app/full-height'
import {
  hasActiveServiceWorkerController,
  runBootSequence,
} from './app/pwa-boot'
import { renderShell } from './app/shell'

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) {
  throw new Error('Не найден #app')
}
const root: HTMLDivElement = appRoot
installFullHeight()

const AUTO_RESUME_INTERVAL_MS = 15_000

async function boot(): Promise<void> {
  let loader: BootLoaderHandle | null = null
  let running = false
  let failed = false
  let autoResumeTimer: number | undefined
  let attempt: () => Promise<void>

  const ensureLoader = (): BootLoaderHandle => {
    if (loader) return loader
    loader = mountBootLoader(document.body)
    loader.setRetryHandler(() => void attempt())
    return loader
  }

  const onOnline = (): void => {
    if (failed) void attempt()
  }

  attempt = async (): Promise<void> => {
    if (running) return
    running = true
    try {
      const res = await runBootSequence((progress) => loader?.setProgress(progress))
      if (res.ok) {
        failed = false
        window.removeEventListener('online', onOnline)
        window.clearInterval(autoResumeTimer)
        // Welcome строится под экраном загрузки, пока сова убирает листья.
        const finale = loader?.finish()
        renderShell(root)
        await finale
        loader?.unmount()
      } else {
        failed = true
        ensureLoader().setError(res.errorMessage)
        if (autoResumeTimer == null) {
          autoResumeTimer = window.setInterval(onOnline, AUTO_RESUME_INTERVAL_MS)
        }
      }
    } finally {
      running = false
    }
  }

  window.addEventListener('online', onOnline)

  // При активном controller всё уже локально: не показываем фальшивую уборку на секунду.
  if (!hasActiveServiceWorkerController()) ensureLoader()

  await attempt()
}

void boot()
