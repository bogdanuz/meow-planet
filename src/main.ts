import './styles/global.css'
import './styles/placeholders.css'
import './styles/game-stub.css'
import './styles/game-common.css'
import './styles/shell.css'
import './styles/parent.css'
import { mountBootLoader } from './app/boot-loader'
import { runBootSequence } from './app/pwa-boot'
import { renderShell } from './app/shell'

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) {
  throw new Error('Не найден #app')
}
const root: HTMLDivElement = appRoot

async function boot(): Promise<void> {
  const loader = mountBootLoader(root)

  const attempt = async (): Promise<void> => {
    const res = await runBootSequence((p) => loader.setProgress(p))
    if (res.ok) {
      loader.unmount()
      renderShell(root)
    } else {
      loader.setError(res.errorMessage)
    }
  }

  loader.setRetryHandler(() => {
    // Кнопка “Повторить” должна перезапустить boot-логику с нуля.
    // Повторный запуск welcome/menu всё равно не покажет до успешного результата.
    void attempt()
  })

  await attempt()
}

void boot()
