import { createPoseSlot } from '../shared/pose-slot'

// Workbox precache в `dist/sw.js` матчится по URL без query-параметров.
// Поэтому в рантайм не добавляем `?v=...`, чтобы офлайн-режим не ломался.

export function menuCardPngUrl(gameId: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/menu/card-${gameId}.png`
}

export function menuVisitBedPngUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/menu/menu-visit-bed.png`
}

/** Один проход: наклон влево, радость, наклон вправо и обратно к лёгкому наклону. */
const MENU_MEOW_DANCE_PASS = [2, 3, 4, 5, 6, 5, 4, 3, 2] as const
export const MEOW_DANCE_STEP_MS = 420
const DANCES_ON_ENTER = 2

/** Покой — прямая сова (кадр 1). Улыбка (кадр 4) в танце не используется. */
export const OLLI_IDLE_FRAME = 1
export const OLLI_DANCE_FRAMES = [1, 2, 3, 2, 1, 5, 6, 5, 1] as const
export const OLLI_DANCE_STEP_MS = MEOW_DANCE_STEP_MS

export function menuOlliDanceFrameUrl(frame: number): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const id = String(frame).padStart(2, '0')
  return `${base}assets/mascot/menu-dance-olli/frame_${id}.png`
}

export function menuOlliBlinkUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/mascot/menu-dance-olli/frame_blink.png`
}

export function menuVisitTreePngUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/menu/menu-visit-tree.png`
}

export function menuMeowDanceFrameUrl(frame: number): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const id = String(frame).padStart(2, '0')
  return `${base}assets/mascot/menu-dance/frame_${id}.png`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function prefersStill(): boolean {
  const media = window.matchMedia?.bind(window)
  return Boolean(media && media('(prefers-reduced-motion: reduce)').matches)
}

const IDLE_TOAST_MIN_MS = 3000
const IDLE_TOAST_MAX_MS = 5000

type DanceOptions = {
  frames: readonly number[]
  stepMs: number
  frameUrl: (frame: number) => string
  idleFrame?: number
}

/**
 * При входе — два танца и стойка.
 * «Погладь меня» всплывает, если персонажа не трогали 3–5 секунд.
 * Тап или поглаживание прячут тост и запускают танец снова.
 */
export function bindMenuPet(
  img: HTMLImageElement,
  toast: HTMLElement,
  options?: DanceOptions,
): void {
  const frames = options?.frames ?? MENU_MEOW_DANCE_PASS
  const stepMs = options?.stepMs ?? MEOW_DANCE_STEP_MS
  const frameUrl = options?.frameUrl ?? menuMeowDanceFrameUrl
  const idleFrame = options?.idleFrame ?? 1
  const anchor = img.parentElement
  let busy = false
  let idleTimer = 0
  const slot = createPoseSlot(img, 'is-under')
  const under = slot.under

  for (const frame of new Set([...frames, idleFrame])) {
    const preload = new Image()
    preload.src = frameUrl(frame)
  }

  const hideToast = (): void => {
    toast.classList.remove('is-on')
  }

  const scheduleToast = (): void => {
    window.clearTimeout(idleTimer)
    const delay =
      IDLE_TOAST_MIN_MS + Math.random() * (IDLE_TOAST_MAX_MS - IDLE_TOAST_MIN_MS)
    idleTimer = window.setTimeout(() => {
      if (!img.isConnected) return
      toast.classList.add('is-on')
    }, delay)
  }

  const showFrame = async (frame: number): Promise<void> => {
    await slot.show(frameUrl(frame))
    if (anchor) anchor.dataset.lean = ''
  }

  const play = async (times: number): Promise<void> => {
    if (busy || prefersStill()) return
    busy = true
    window.clearTimeout(idleTimer)
    hideToast()
    anchor?.classList.add('is-dancing')
    try {
      for (let pass = 0; pass < times; pass += 1) {
        for (const frame of frames) {
          if (!img.isConnected) return
          await showFrame(frame)
          await wait(stepMs)
        }
      }
    } finally {
      busy = false
      if (!img.isConnected) return
      await showFrame(idleFrame)
      if (anchor) anchor.dataset.lean = ''
      anchor?.classList.remove('is-dancing')
      scheduleToast()
    }
  }

  const onPet = (event: Event): void => {
    event.preventDefault()
    event.stopPropagation()
    void play(DANCES_ON_ENTER)
  }

  img.addEventListener('click', onPet)
  under.addEventListener('click', onPet)
  toast.addEventListener('click', onPet)

  let stroking = false
  let originX = 0
  let originY = 0
  const onDown = (event: PointerEvent): void => {
    stroking = true
    originX = event.clientX
    originY = event.clientY
  }
  const onMove = (event: PointerEvent): void => {
    if (!stroking) return
    if (Math.hypot(event.clientX - originX, event.clientY - originY) < 28) return
    stroking = false
    onPet(event)
  }
  const onUp = (): void => {
    stroking = false
  }
  for (const node of [img, under]) {
    node.addEventListener('pointerdown', onDown)
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerup', onUp)
    node.addEventListener('pointercancel', onUp)
  }

  if (prefersStill()) {
    scheduleToast()
    return
  }
  void play(DANCES_ON_ENTER)
}

export function bindMenuMeowPet(img: HTMLImageElement, toast: HTMLElement): void {
  bindMenuPet(img, toast)
}

export function bindMenuOlliPet(img: HTMLImageElement, toast: HTMLElement): void {
  bindMenuPet(img, toast, {
    frames: OLLI_DANCE_FRAMES,
    stepMs: OLLI_DANCE_STEP_MS,
    frameUrl: menuOlliDanceFrameUrl,
    idleFrame: OLLI_IDLE_FRAME,
  })
}
