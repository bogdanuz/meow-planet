/**
 * Мягкая тень под картинкой без CSS `filter: drop-shadow`. iPad рисует фильтр на движущемся
 * слое с цветным прямоугольником и шлейфом за ним — поэтому тень один раз рисуется в отдельную
 * картинку (те же смещение, размытие и цвет, что у drop-shadow) и лежит под предметом.
 *
 * Родитель картинки должен совпадать с её рамкой и быть `position: relative/absolute`.
 */

export type SoftShadow = {
  /** Смещение и размытие — в CSS-пикселях на экране, как в drop-shadow. */
  readonly x: number
  readonly y: number
  readonly blur: number
  readonly color: string
}

type Baked = { url: string; fx: number; fy: number }

const baked = new Map<string, Promise<Baked | null>>()

/** Холст с полями `pad` и тенями картинки; `withArt` — поверх теней и саму картинку. */
function drawShadows(
  source: CanvasImageSource,
  nw: number,
  nh: number,
  shadows: readonly SoftShadow[],
  scale: number,
  withArt: boolean,
): { canvas: HTMLCanvasElement; pad: number } | null {
  const reach = Math.max(...shadows.map((s) => s.blur * 1.5 + Math.max(Math.abs(s.x), Math.abs(s.y))))
  const pad = Math.ceil(reach * scale)
  const canvas = document.createElement('canvas')
  canvas.width = nw + pad * 2
  canvas.height = nh + pad * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // Сама картинка рисуется за краем холста, на холст попадает только её тень.
  const away = canvas.width + nw
  for (const s of shadows) {
    ctx.shadowColor = s.color
    ctx.shadowBlur = s.blur * scale
    ctx.shadowOffsetX = s.x * scale + away
    ctx.shadowOffsetY = s.y * scale
    ctx.drawImage(source, pad - away, pad, nw, nh)
  }
  if (withArt) {
    ctx.shadowColor = 'transparent'
    ctx.drawImage(source, pad, pad, nw, nh)
  }
  return { canvas, pad }
}

function bake(img: HTMLImageElement, shadows: readonly SoftShadow[], scale: number): Promise<Baked | null> {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  const drawn = drawShadows(img, nw, nh, shadows, scale, false)
  if (!drawn) return Promise.resolve(null)
  const { canvas, pad } = drawn
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? { url: URL.createObjectURL(blob), fx: pad / nw, fy: pad / nh } : null))
  })
}

/**
 * Тень картинки по адресу — для рамок `border-image`, под которые слой-картинку не подложить.
 * `scale` — пикселей картинки на CSS-пиксель; `pad` — поле с каждой стороны в пикселях картинки.
 */
export async function softShadowUrl(
  src: string,
  shadows: readonly SoftShadow[],
  scale: number,
): Promise<{ url: string; pad: number } | null> {
  const img = new Image()
  img.src = src
  try {
    await img.decode()
  } catch {
    return null
  }
  const result = await bake(img, shadows, scale)
  return result && { url: result.url, pad: Math.round(result.fx * img.naturalWidth) }
}

/**
 * Холст-картинка с уже нарисованной тенью — для того, что двигают пальцем (холст не картинка,
 * слой под него не подложить). `pad` — доля поля с каждой стороны от размера `source`:
 * показывать холст шире на `(1 + 2 * pad)` и сдвигать на `-pad`.
 */
export function canvasWithSoftShadow(
  source: HTMLCanvasElement,
  shownPx: number,
  shadows: readonly SoftShadow[],
): { canvas: HTMLCanvasElement; pad: number } {
  const drawn = drawShadows(source, source.width, source.height, shadows, source.width / shownPx, true)
  if (!drawn) return { canvas: source, pad: 0 }
  return { canvas: drawn.canvas, pad: drawn.pad / source.width }
}

function shadowKey(img: HTMLImageElement, shadows: readonly SoftShadow[]): { key: string; scale: number } | null {
  const box = img.getBoundingClientRect()
  if (!img.naturalWidth || !img.naturalHeight || !box.width || !box.height) return null
  const fit = getComputedStyle(img).objectFit
  const k =
    fit === 'contain' || fit === 'scale-down'
      ? Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight)
      : box.width / img.naturalWidth
  const scale = Math.round((1 / k) * 4) / 4
  return { key: `${img.currentSrc || img.src}|${scale}|${JSON.stringify(shadows)}`, scale }
}

function shadowUrl(img: HTMLImageElement, shadows: readonly SoftShadow[], key: string, scale: number): Promise<Baked | null> {
  let url = baked.get(key)
  if (!url) {
    url = bake(img, shadows, scale).catch(() => null)
    baked.set(key, url)
  }
  return url
}

function place(layer: HTMLImageElement, img: HTMLImageElement, { url, fx, fy }: Baked): void {
  // Вписываем слой так же, как картинку: при contain поля у слоя и картинки совпадают.
  const fit = getComputedStyle(img)
  layer.style.objectFit = fit.objectFit
  layer.style.objectPosition = fit.objectPosition
  layer.style.left = `${-fx * 100}%`
  layer.style.top = `${-fy * 100}%`
  layer.style.width = `${(1 + 2 * fx) * 100}%`
  layer.style.height = `${(1 + 2 * fy) * 100}%`
  // Та же точка поворота, что у картинки: качается вместе с ней, если анимация общая.
  const [ox = 0, oy = 0] = fit.transformOrigin.split(' ').map(parseFloat)
  layer.style.transformOrigin = `${ox + fx * img.offsetWidth}px ${oy + fy * img.offsetHeight}px`
  if (layer.getAttribute('src') !== url) layer.src = url
}

/**
 * Кладёт под `img` слой с тенью (класс `soft-shadow` + `extraClass`). Возвращает слой:
 * его можно прятать и показывать классами (например, свечение выбранной игрушки).
 * Новая картинка в `img` или заметно другой размер — тень печётся заново.
 * `followOpacity` — слой повторяет `style.opacity` картинки (два слоя позы, см. pose-slot).
 */
export function addSoftShadow(
  img: HTMLImageElement,
  shadows: readonly SoftShadow[],
  extraClass = '',
  { followOpacity = false } = {},
): HTMLImageElement {
  const layer = document.createElement('img')
  layer.className = extraClass ? `soft-shadow ${extraClass}` : 'soft-shadow'
  layer.alt = ''
  layer.setAttribute('aria-hidden', 'true')
  layer.draggable = false
  img.before(layer)
  let shownKey = ''
  let shown: Baked | null = null
  const tryBake = (): void => {
    if (!img.isConnected || !img.complete) return
    const next = shadowKey(img, shadows)
    if (!next) return
    if (next.key === shownKey) {
      if (shown) place(layer, img, shown)
      return
    }
    shownKey = next.key
    void shadowUrl(img, shadows, next.key, next.scale).then((result) => {
      if (!result || shownKey !== next.key) return
      shown = result
      place(layer, img, result)
    })
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(tryBake).observe(img)
  img.addEventListener('load', tryBake)
  if (followOpacity) {
    const sync = (): void => {
      layer.style.opacity = img.style.opacity
    }
    new MutationObserver(sync).observe(img, { attributes: true, attributeFilter: ['style'] })
    sync()
  }
  tryBake()
  return layer
}
