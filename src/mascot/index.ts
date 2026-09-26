/**
 * Мяу — CSS-заглушка до финальных ассетов (путь А / S13).
 * Спокойные позы без ярких вспышек.
 */
export type MascotPose = 'idle' | 'happy' | 'pointing' | 'sleepy' | 'dance'

export function createMascotPlaceholder(pose: MascotPose = 'idle'): HTMLElement {
  const el = document.createElement('div')
  el.className = 'mascot-ph'
  el.dataset.pose = pose
  el.setAttribute('aria-hidden', 'true')

  const face = document.createElement('span')
  face.className = 'mascot-ph__face'
  face.textContent = 'Мяу'
  el.append(face)
  return el
}

export function setMascotPose(el: HTMLElement, pose: MascotPose): void {
  el.dataset.pose = pose
}
