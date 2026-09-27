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
const DANCE_STEP_MS = 420
const DANCES_ON_ENTER = 2

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

/**
 * При входе — два танца и стойка.
 * «Погладь меня» всплывает, если кота не трогали 3–5 секунд.
 * Тап прячет тост, снова два танца, потом снова ожидание.
 */
export function bindMenuMeowPet(img: HTMLImageElement, toast: HTMLElement): void {
  let busy = false
  let idleTimer = 0

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

  const play = async (times: number): Promise<void> => {
    if (busy || prefersStill()) return
    busy = true
    window.clearTimeout(idleTimer)
    hideToast()
    try {
      for (let pass = 0; pass < times; pass += 1) {
        for (const frame of MENU_MEOW_DANCE_PASS) {
          if (!img.isConnected) return
          img.src = menuMeowDanceFrameUrl(frame)
          await wait(DANCE_STEP_MS)
        }
      }
    } finally {
      busy = false
      if (!img.isConnected) return
      img.src = menuMeowDanceFrameUrl(1)
      scheduleToast()
    }
  }

  const onPet = (event: Event): void => {
    event.preventDefault()
    event.stopPropagation()
    void play(DANCES_ON_ENTER)
  }

  img.addEventListener('click', onPet)
  toast.addEventListener('click', onPet)

  if (prefersStill()) {
    scheduleToast()
    return
  }
  void play(DANCES_ON_ENTER)
}
