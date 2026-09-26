import type { BalloonFieldColor } from './logic'

/** Cache-bust при замене мастеров в assets-master/games/balloon-pop/. */
export const BALLOON_ASSET_VERSION = '3'

export type BalloonMeowPose = 'idle' | 'happy' | 'miss'

export type BalloonMeowEvent = 'idle' | 'praise' | 'task' | 'miss'

function publicUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/balloon-pop/${file}?v=${BALLOON_ASSET_VERSION}`
}

export function balloonSkyUrl(): string {
  return publicUrl('balloon-sky-bg.webp')
}

export function balloonPngUrl(color: BalloonFieldColor): string {
  return publicUrl(`balloon-${color}.png`)
}

export function meowPresenterUrl(pose: BalloonMeowPose): string {
  return publicUrl(`meow-presenter-${pose}.png`)
}

export function balloonMeowPoseForEvent(event: BalloonMeowEvent): BalloonMeowPose {
  if (event === 'miss') return 'miss'
  if (event === 'idle') return 'idle'
  return 'happy'
}
