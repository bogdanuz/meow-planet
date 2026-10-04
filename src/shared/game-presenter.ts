import { presenterPoseUrl, type CompanionId, type PresenterPose } from './companion'
import { createPoseSlot } from './pose-slot'
import { addSoftShadow, type SoftShadow } from './soft-shadow'
import './game-presenter.css'

export type GamePresenter = {
  element: HTMLElement
  setLine: (message: string, pose?: PresenterPose) => void
}

/**
 * Нижний левый помощник. Игры не рисуют свою копию.
 * `shadow` — мягкая тень картинкой (не filter: на iPad фильтр у качающегося слоя даёт рамку).
 */
export function createGamePresenter(companion: CompanionId, { shadow }: { shadow?: SoftShadow } = {}): GamePresenter {
  const aside = document.createElement('aside')
  aside.className = 'game-presenter'
  aside.dataset.companion = companion

  const img = document.createElement('img')
  img.className = 'game-presenter__art'
  img.alt = ''
  img.decoding = 'async'
  img.src = presenterPoseUrl(companion, 'idle')

  const speech = document.createElement('p')
  speech.className = 'game-presenter__speech'
  speech.setAttribute('aria-live', 'polite')

  // Покачивание — на рамке позы: оба слоя кадра и их тени двигаются вместе.
  const poseHost = document.createElement('div')
  poseHost.className = 'game-presenter__pose meow-idle'
  poseHost.append(img)
  aside.append(poseHost, speech)
  const slot = createPoseSlot(img)
  if (shadow) {
    for (const layer of [img, slot.under]) addSoftShadow(layer, [shadow], '', { followOpacity: true })
  }
  for (const pose of ['idle', 'happy', 'miss'] as const) {
    const preload = new Image()
    preload.src = presenterPoseUrl(companion, pose)
  }

  return {
    element: aside,
    setLine(message: string, pose: PresenterPose = 'idle') {
      speech.textContent = message
      poseHost.classList.toggle('meow-idle', pose === 'idle')
      void slot.show(presenterPoseUrl(companion, pose))
    },
  }
}
