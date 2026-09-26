/** Математика кадрирования 4:3 (альбом) без UI. */

export const PUZZLE_LANDSCAPE_WIDTH = 960
export const PUZZLE_LANDSCAPE_HEIGHT = 720

export type CoverPan = {
  panX: number
  panY: number
  scale: number
  viewW: number
  viewH: number
}

/** Масштаб cover и стартовый pan по центру. */
export function initialCoverPan(
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number,
): CoverPan {
  const scale = Math.max(viewW / imageW, viewH / imageH)
  const displayW = imageW * scale
  const displayH = imageH * scale
  return {
    scale,
    viewW,
    viewH,
    panX: (viewW - displayW) / 2,
    panY: (viewH - displayH) / 2,
  }
}

export function clampCoverPan(pan: CoverPan, imageW: number, imageH: number): CoverPan {
  const displayW = imageW * pan.scale
  const displayH = imageH * pan.scale
  const minX = Math.min(0, pan.viewW - displayW)
  const minY = Math.min(0, pan.viewH - displayH)
  const maxX = 0
  const maxY = 0
  return {
    ...pan,
    panX: Math.min(maxX, Math.max(minX, pan.panX)),
    panY: Math.min(maxY, Math.max(minY, pan.panY)),
  }
}

/** Область исходника (px), попадающая в viewport 4:3. */
export function sourceRectFromPan(
  pan: CoverPan,
  imageW: number,
  imageH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const sx = Math.max(0, -pan.panX / pan.scale)
  const sy = Math.max(0, -pan.panY / pan.scale)
  const sw = Math.min(imageW - sx, pan.viewW / pan.scale)
  const sh = Math.min(imageH - sy, pan.viewH / pan.scale)
  return { sx, sy, sw, sh }
}
