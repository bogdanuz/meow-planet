/**
 * UI-иконки хаба (P15-04) — **временные SVG**; финал подберёт владелец
 * (`docs/assets/UI-ICONS-OWNER-BATCH.md`).
 */
export type UiIconId =
  | 'settings'
  | 'sound-on'
  | 'sound-off'
  | 'home'
  | 'back'

const ICON_FILES: Record<UiIconId, string> = {
  settings: 'icon-settings.png',
  'sound-on': 'icon-sound.png',
  'sound-off': 'icon-sound.png',
  home: 'icon-home.png',
  back: 'icon-back.png',
}

export function uiIconUrl(id: UiIconId): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/ui/icons/${ICON_FILES[id]}`
}

export function createUiIconImg(
  id: UiIconId,
  options: { decorative?: boolean; alt?: string } = {},
): HTMLImageElement {
  const img = document.createElement('img')
  img.className = 'ui-icon'
  img.src = uiIconUrl(id)
  img.width = 28
  img.height = 28
  img.decoding = 'async'
  if (options.decorative) {
    img.alt = ''
    img.setAttribute('aria-hidden', 'true')
  } else {
    img.alt = options.alt ?? ''
  }
  return img
}
