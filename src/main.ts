import './styles/global.css'
import './styles/placeholders.css'
import './styles/game-stub.css'
import './styles/game-common.css'
import './styles/shell.css'
import './styles/parent.css'
import { mountBootLoader, type BootLoaderHandle } from './app/boot-loader'
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

async function boot(): Promise<void> {
  let loader: BootLoaderHandle | null = null
  let attempt: () => Promise<void>

  const ensureLoader = (): BootLoaderHandle => {
    if (loader) return loader
    loader = mountBootLoader(root)
    loader.setRetryHandler(() => void attempt())
    return loader
  }

  attempt = async (): Promise<void> => {
    const res = await runBootSequence((progress) => loader?.setProgress(progress))
    if (res.ok) {
      loader?.unmount()
      renderShell(root)
    } else {
      ensureLoader().setError(res.errorMessage)
    }
  }

  // При активном controller всё уже локально: не показываем фальшивую уборку на секунду.
  if (!hasActiveServiceWorkerController()) ensureLoader()

  await attempt()
}

void boot()
