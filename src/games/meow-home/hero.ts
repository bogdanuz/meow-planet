/**
 * «В гости» — персонаж. Дома — покадровая анимация (два кадра на действие).
 * На улице и одетый в прихожей — «кукла»: стоя + лицо настроения + одежда слоями + зонтик.
 */
import {
  FRAME_ACTIONS,
  faceUrl,
  frameUrl,
  itemUrl,
  standUrl,
  wearUrl,
  type FaceMood,
  type FrameAction,
  type Who,
} from './art'
import { LAYER_ORDER, type Outfit, type WearItem } from './weather'

const ACTION_FRAME_MS = 380
const IDLE_MAIN_MS = 1700
const IDLE_ALT_MS = 480

export function createHero(who: Who, still: boolean) {
  const el = document.createElement('div')
  el.className = 'mh__hero'
  el.dataset.role = 'hero'
  const img = document.createElement('img')
  img.className = 'mh__hero-img'
  img.alt = ''
  img.draggable = false
  img.decoding = 'async'
  el.append(img)

  // Все кадры сразу в память: смена кадра без мигания.
  const cache: HTMLImageElement[] = []
  for (const action of FRAME_ACTIONS) {
    for (const n of [1, 2] as const) {
      const pre = new Image()
      pre.decoding = 'async'
      pre.src = frameUrl(who, action, n)
      cache.push(pre)
    }
  }

  let base: FrameAction = 'idle'
  let action: FrameAction | null = null
  let frame: 1 | 2 = 1
  let tick: ReturnType<typeof setTimeout> | undefined
  let end: ReturnType<typeof setTimeout> | undefined
  let onEnd: (() => void) | null = null

  const show = (): void => {
    const current = action ?? base
    img.src = frameUrl(who, current, frame)
    el.dataset.action = current
  }
  const schedule = (): void => {
    clearTimeout(tick)
    const ms = action ? ACTION_FRAME_MS * (still ? 2 : 1) : frame === 1 ? IDLE_MAIN_MS : IDLE_ALT_MS
    tick = setTimeout(() => {
      frame = frame === 1 ? 2 : 1
      show()
      schedule()
    }, ms)
  }
  const restart = (): void => {
    frame = 1
    show()
    schedule()
  }
  restart()

  return {
    el,
    busy: (): boolean => action !== null,
    current: (): FrameAction => action ?? base,
    setBase(next: FrameAction): void {
      if (base === next) return
      base = next
      if (!action) restart()
    },
    /** Действие на `ms` миллисекунд, потом снова base. Новое действие отменяет прежнее без колбэка. */
    play(next: FrameAction, ms: number, done?: () => void): void {
      clearTimeout(end)
      action = next
      onEnd = done ?? null
      restart()
      end = setTimeout(() => {
        action = null
        const cb = onEnd
        onEnd = null
        restart()
        cb?.()
      }, ms)
    },
    stop(): void {
      clearTimeout(end)
      action = null
      onEnd = null
      restart()
    },
    destroy(): void {
      clearTimeout(tick)
      clearTimeout(end)
      cache.length = 0
    },
  }
}

export type Hero = ReturnType<typeof createHero>

/** Покадровая картинка в своём месте (купание в ванне, сон в кровати). */
export function createFramePlayer(who: Who, still: boolean) {
  const img = document.createElement('img')
  img.className = 'mh__frames'
  img.alt = ''
  img.draggable = false
  img.decoding = 'async'
  let tick: ReturnType<typeof setInterval> | undefined
  return {
    el: img,
    start(action: FrameAction, ms = 520): void {
      clearInterval(tick)
      let frame: 1 | 2 = 1
      img.src = frameUrl(who, action, frame)
      img.dataset.action = action
      tick = setInterval(() => {
        frame = frame === 1 ? 2 : 1
        img.src = frameUrl(who, action, frame)
      }, still ? ms * 2 : ms)
    },
    stop(): void {
      clearInterval(tick)
    },
  }
}

export function createDoll(who: Who) {
  const el = document.createElement('div')
  el.className = 'mh__doll'
  el.dataset.role = 'doll'
  const make = (src: string, cls: string): HTMLImageElement => {
    const img = document.createElement('img')
    img.className = cls
    img.alt = ''
    img.draggable = false
    img.decoding = 'async'
    img.src = src
    return img
  }
  const body = document.createElement('div')
  body.className = 'mh__doll-body'
  const stand = make(standUrl(who), 'mh__doll-layer')
  const face = make(faceUrl(who, 'joy'), 'mh__doll-layer mh__doll-face')
  face.hidden = true
  body.append(stand, face)
  const layers = new Map<WearItem, HTMLImageElement>()
  for (const item of LAYER_ORDER) {
    if (item === 'umbrella') continue
    const layer = make(wearUrl(who, item), 'mh__doll-layer')
    layer.dataset.wear = item
    layer.hidden = true
    layers.set(item, layer)
    body.append(layer)
  }
  const umbrella = make(itemUrl('umbrella-open'), 'mh__doll-umbrella')
  umbrella.hidden = true
  el.append(body, umbrella)

  return {
    el,
    render(outfit: Outfit, mood: FaceMood | null): void {
      for (const [item, layer] of layers) layer.hidden = !outfit.includes(item)
      umbrella.hidden = !outfit.includes('umbrella')
      face.hidden = mood === null
      if (mood) face.src = faceUrl(who, mood)
      el.dataset.mood = mood ?? 'ok'
      el.dataset.outfit = [...outfit].sort().join(' ')
    },
  }
}

export type Doll = ReturnType<typeof createDoll>
