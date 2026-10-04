import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addSoftShadow, canvasWithSoftShadow, type SoftShadow } from '../../src/shared/soft-shadow'

const SHADOW: SoftShadow = { x: 0, y: 6, blur: 10, color: 'rgb(0 0 0 / 20%)' }
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function fakeImage(host: HTMLElement, src: string, natural = 200): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  Object.defineProperty(img, 'complete', { configurable: true, get: () => true })
  Object.defineProperty(img, 'naturalWidth', { configurable: true, get: () => natural })
  Object.defineProperty(img, 'naturalHeight', { configurable: true, get: () => natural })
  img.getBoundingClientRect = () => ({ width: 100, height: 100 }) as DOMRect
  host.append(img)
  return img
}

describe('soft-shadow', () => {
  let blobs = 0
  beforeEach(() => {
    blobs = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      cb(new Blob(['x']))
    })
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => `blob:shadow-${(blobs += 1)}` }))
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it('кладёт слой прямо под картинку, скрытый от экранного диктора', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const img = fakeImage(host, '/toy.png')
    const layer = addSoftShadow(img, [SHADOW], 'toy-glow')
    expect(img.previousElementSibling).toBe(layer)
    expect(layer.className).toBe('soft-shadow toy-glow')
    expect(layer.getAttribute('aria-hidden')).toBe('true')
  })

  it('печёт тень в отдельную картинку с полями под размытие', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const img = fakeImage(host, '/toy.png')
    const layer = addSoftShadow(img, [SHADOW])
    await flush()
    expect(layer.getAttribute('src')).toMatch(/^blob:shadow-/)
    expect(parseFloat(layer.style.left)).toBeLessThan(0)
    expect(parseFloat(layer.style.width)).toBeGreaterThan(100)
  })

  it('новая картинка — тень печётся заново', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const img = fakeImage(host, '/pose-idle.png')
    const layer = addSoftShadow(img, [SHADOW])
    await flush()
    const first = layer.getAttribute('src')
    img.src = '/pose-happy.png'
    img.dispatchEvent(new Event('load'))
    await flush()
    expect(layer.getAttribute('src')).not.toBe(first)
  })

  it('followOpacity — слой гаснет вместе со своим кадром позы', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const img = fakeImage(host, '/pose.png')
    const layer = addSoftShadow(img, [SHADOW], '', { followOpacity: true })
    img.style.opacity = '0'
    await flush()
    expect(layer.style.opacity).toBe('0')
    img.style.opacity = '1'
    await flush()
    expect(layer.style.opacity).toBe('1')
  })

  it('холст для переноса пальцем: тень и сама деталь на холсте с полями', () => {
    const source = document.createElement('canvas')
    source.width = 96
    source.height = 96
    const { canvas, pad } = canvasWithSoftShadow(source, 96, [SHADOW])
    expect(canvas).not.toBe(source)
    expect(pad).toBeGreaterThan(0)
    expect(canvas.width).toBe(Math.round(96 * (1 + 2 * pad)))
  })
})
