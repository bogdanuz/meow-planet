import { presenterPoseUrl, type CompanionId, type PresenterPose } from './companion'
import { createPoseSlot } from './pose-slot'
import './game-presenter.css'

export type GamePresenter = {
  element: HTMLElement
  setLine: (message: string, pose?: PresenterPose) => void
}

/** Нижний левый помощник. Игры не рисуют свою копию. */
export function createGamePresenter(companion: CompanionId): GamePresenter {
  const aside = document.createElement('aside')
  aside.className = 'game-presenter'
  aside.dataset.companion = companion

  const img = document.createElement('img')
  img.className = 'game-presenter__art meow-idle'
  img.alt = ''
  img.decoding = 'async'
  img.src = presenterPoseUrl(companion, 'idle')

  const speech = document.createElement('p')
  speech.className = 'game-presenter__speech'
  speech.setAttribute('aria-live', 'polite')

  const poseHost = document.createElement('div')
  poseHost.className = 'game-presenter__pose'
  poseHost.append(img)
  aside.append(poseHost, speech)
  const slot = createPoseSlot(img)
  for (const pose of ['idle', 'happy', 'miss'] as const) {
    const preload = new Image()
    preload.src = presenterPoseUrl(companion, pose)
  }

  return {
    element: aside,
    setLine(message: string, pose: PresenterPose = 'idle') {
      speech.textContent = message
      const idle = pose === 'idle'
      img.classList.toggle('meow-idle', idle)
      slot.under.classList.toggle('meow-idle', idle)
      void slot.show(presenterPoseUrl(companion, pose))
    },
  }
}
