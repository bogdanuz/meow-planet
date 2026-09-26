import { placeholderClass, type PlaceholderColor, type PlaceholderShape } from './placeholders'

export type BalloonTaskVisual =
  | { gameId: 'balloon-pop'; kind: 'color'; color: PlaceholderColor }
  | { gameId: 'balloon-pop'; kind: 'size'; size: 'lg' | 'sm' }

export type HideSeekTaskVisual = {
  gameId: 'hide-seek'
  kind: 'target'
  shape: PlaceholderShape
  color: PlaceholderColor
}

export type GameTaskVisual = BalloonTaskVisual | HideSeekTaskVisual

export function renderGameTaskVisualCue(cue: GameTaskVisual): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'chrome__task-cue-inner'
  wrap.setAttribute('aria-hidden', 'true')

  if (cue.gameId === 'hide-seek') {
    const icon = document.createElement('span')
    icon.className = `${placeholderClass(cue.shape, cue.color)} chrome__task-target`
    wrap.append(icon)
    return wrap
  }

  if (cue.kind === 'color') {
    const swatch = document.createElement('span')
    swatch.className = `chrome__task-swatch ph-color--${cue.color}`
    wrap.append(swatch)
    return wrap
  }

  const icon = document.createElement('span')
  icon.className =
    cue.size === 'lg'
      ? 'chrome__task-size chrome__task-size--lg'
      : 'chrome__task-size chrome__task-size--sm'
  wrap.append(icon)
  return wrap
}
