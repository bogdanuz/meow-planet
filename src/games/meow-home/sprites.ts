/** «В гости» — картинки и кнопки на сцене в процентах фона. */
import { ITEM_ASPECT } from './art-aspect'
import { itemUrl } from './art'
import type { Rect, Spot } from './scene'

/** Сцена 4:3: высота в % сцены = ширина × 4/3 ÷ (ширина/высота картинки). */
const SCENE_ASPECT = 4 / 3

export function spotWidth(spot: Spot, aspect: number): number {
  if (spot.w !== undefined) return spot.w
  return ((spot.h ?? 10) / SCENE_ASPECT) * aspect
}

export function placeSpot(el: HTMLElement, spot: Spot, aspect = 1): void {
  el.style.left = `${spot.x}%`
  el.style.top = `${spot.y}%`
  el.style.width = `${spotWidth(spot, aspect)}%`
  el.dataset.anchor = spot.a ?? 'b'
}

export function placeRect(el: HTMLElement, r: Rect): void {
  el.style.left = `${r.x0}%`
  el.style.top = `${r.y0}%`
  el.style.width = `${r.x1 - r.x0}%`
  el.style.height = `${r.y1 - r.y0}%`
}

function makeImg(src: string): HTMLImageElement {
  const img = document.createElement('img')
  img.alt = ''
  img.draggable = false
  img.decoding = 'async'
  img.src = src
  return img
}

/** Украшение без нажатия. */
export function decoSprite(art: string, spot: Spot, cls = ''): HTMLImageElement {
  const img = makeImg(itemUrl(art))
  img.className = `mh__sprite ${cls}`.trim()
  img.setAttribute('aria-hidden', 'true')
  placeSpot(img, spot, ITEM_ASPECT[art] ?? 1)
  return img
}

/** Предмет-кнопка: картинка + невидимый запас по краям для пальца. */
export function propButton(art: string, spot: Spot, label: string, cls = ''): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `mh__prop ${cls}`.trim()
  btn.setAttribute('aria-label', label)
  btn.dataset.art = art
  btn.append(makeImg(itemUrl(art)))
  placeSpot(btn, spot, ITEM_ASPECT[art] ?? 1)
  keepAspect(btn, art)
  return btn
}

/** Размер кнопки известен до загрузки картинки: её можно нажать сразу, сцена не прыгает. */
function keepAspect(btn: HTMLElement, art: string): void {
  const aspect = ITEM_ASPECT[art]
  btn.style.aspectRatio = aspect ? String(aspect) : ''
}

/** Невидимая зона на фоне (дверь, окно, ванна). */
export function hotspot(rect: Rect, label: string, role: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'mh__hot'
  btn.dataset.role = role
  btn.setAttribute('aria-label', label)
  placeRect(btn, rect)
  return btn
}

export function setArt(el: HTMLElement, art: string): void {
  const img = el instanceof HTMLImageElement ? el : el.querySelector('img')
  if (img) img.src = itemUrl(art)
  el.dataset.art = art
  if (el instanceof HTMLButtonElement) keepAspect(el, art)
}
