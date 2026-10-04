import { isHexColor } from './creative-palette'

export const CUSTOM_COLOR_KEY = 'meow-planet.drawing-custom-color'

const SATURATION = 85
const LIGHT_TOP = 88
const LIGHT_RANGE = 62

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const s = saturation / 100
  const l = lightness / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const h = (((hue % 360) + 360) % 360) / 60
  const x = chroma * (1 - Math.abs((h % 2) - 1))
  const [r, g, b] =
    h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0] : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma] : h < 5 ? [x, 0, chroma] : [chroma, 0, x]
  const m = l - chroma / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  return `#${hslToRgb(hue, saturation, lightness).map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function pickerRgbAt(x: number, y: number): [number, number, number] {
  return hslToRgb(clamp01(x) * 359, SATURATION, LIGHT_TOP - clamp01(y) * LIGHT_RANGE)
}

/** Радужное окошко: x — оттенок, y — светлота (сверху светлее). */
export function pickerColorAt(x: number, y: number): string {
  return hslToHex(clamp01(x) * 359, SATURATION, LIGHT_TOP - clamp01(y) * LIGHT_RANGE)
}

/** Рисует окошко той же формулой, что и выбор цвета: что видно — то и рисуется. */
export function paintRainbow(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  const image = ctx.createImageData(width, height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pickerRgbAt(x / (width - 1), y / (height - 1))
      const index = (y * width + x) * 4
      image.data[index] = r
      image.data[index + 1] = g
      image.data[index + 2] = b
      image.data[index + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

/** Где на окошке стоит маркер для этого цвета. */
export function customColorPosition(hex: string): { x: number; y: number } {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = ((value >> 16) & 255) / 255
  const g = ((value >> 8) & 255) / 255
  const b = (value & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = ((max + min) / 2) * 100
  let hue = 0
  const delta = max - min
  if (delta > 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
  }
  if (hue < 0) hue += 360
  return { x: clamp01(hue / 359), y: clamp01((LIGHT_TOP - lightness) / LIGHT_RANGE) }
}

export function loadCustomColor(storage: StorageLike = localStorage): string | null {
  try {
    const raw = storage.getItem(CUSTOM_COLOR_KEY)
    return isHexColor(raw) ? raw.toLowerCase() : null
  } catch {
    return null
  }
}

export function saveCustomColor(hex: string, storage: StorageLike = localStorage): void {
  if (!isHexColor(hex)) return
  try {
    storage.setItem(CUSTOM_COLOR_KEY, hex.toLowerCase())
  } catch {
    // Приватный режим: цвет просто не запомнится.
  }
}
