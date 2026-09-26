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
  try {
    await runBootSequence((p) => loader.setProgress(p))
  } finally {
    loader.unmount()
  }
  renderShell(root)
}

void boot()
