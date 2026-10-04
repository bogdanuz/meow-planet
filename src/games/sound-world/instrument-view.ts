import type { AudioManager } from '../../shared/audio'
import { instrumentPlayUrl } from './assets'
import {
  pendulumAtRest,
  pendulumImpulse,
  pendulumShouldRing,
  stepPendulum,
  type Pendulum,
} from './bell-pendulum'
import {
  DRUM_LAYERS,
  DRUM_SCENE_AR,
  MARACA_LAYERS,
  MARACA_SCENE_AR,
  PIANO_KEY_SLOTS,
  PIANO_SCENE_AR,
  type LayerBox,
} from './instrument-layout'
import { playInstrumentSfx, type InstrumentSfxOptions } from './instrument-sfx'
import { addSoftShadow, type SoftShadow } from '../../shared/soft-shadow'

/** Тени — картинками (shared/soft-shadow.ts): drop-shadow на iPad рисует рамку и шлейф у качающихся слоёв. */
const DRUM_SHADOW: SoftShadow = { x: 0, y: 4, blur: 3, color: 'rgb(82 46 24 / 12%)' }
const MARACA_SHADOW: SoftShadow = { x: 0, y: 10, blur: 6, color: 'rgb(24 42 58 / 26%)' }
const BELL_SHADOW: SoftShadow = { x: 0, y: 18, blur: 10, color: 'rgb(24 42 58 / 48%)' }
const PIANO_SHADOW: SoftShadow = { x: 0, y: 16, blur: 10, color: 'rgb(24 42 58 / 42%)' }
const INSTRUMENT_SHADOW: SoftShadow = { x: 0, y: 14, blur: 10, color: 'rgb(42 74 98 / 38%)' }

export const INSTRUMENT_IDS = new Set([
  'drum',
  'maracas',
  'bell',
  'xylophone',
  'piano',
  'guitar',
])

const PIANO_NOTES = [
  { note: 'До', sfxId: 'piano-do' },
  { note: 'Ре', sfxId: 'piano-re' },
  { note: 'Ми', sfxId: 'piano-mi' },
  { note: 'Фа', sfxId: 'piano-fa' },
  { note: 'Соль', sfxId: 'piano-sol' },
  { note: 'Ля', sfxId: 'piano-la' },
  { note: 'Си', sfxId: 'piano-si' },
] as const

type MountOpts = {
  instrumentId: string
  audio: AudioManager
  sfxUrls: Map<string, string>
}

function spawnSoundWave(host: HTMLElement, clientX: number, clientY: number): void {
  const rect = host.getBoundingClientRect()
  const wave = document.createElement('span')
  wave.className = 'sound-world__sound-wave'
  wave.style.left = `${clientX - rect.left}px`
  wave.style.top = `${clientY - rect.top}px`
  host.append(wave)
  window.setTimeout(() => wave.remove(), 700)
}

function pulse(el: HTMLElement, cls: string, ms: number): void {
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
  window.setTimeout(() => el.classList.remove(cls), ms)
}

/** Ксилофон: питч колокольчика по ступеням до-мажора (до, ре, ми, соль, ля). */
const XYLOPHONE_RATES = [1, 1.122, 1.26, 1.498, 1.682] as const

/** Пауза между шорохами маракаса, пока палец ведёт его по экрану. */
const MARACA_RUSTLE_MS = 120
const MARACA_RUSTLE_MIN_PX = 12
/** Click после pointerdown того же касания — не повторяем звук. */
const PRESS_CLICK_GUARD_MS = 700

/**
 * Звук на касание (pointerdown) — без задержки click. Click без касания
 * (клавиатура, Switch Control) тоже звучит.
 */
function bindPress(el: HTMLElement, handler: (x: number, y: number) => void): void {
  let lastPointerAt = -Infinity
  el.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    lastPointerAt = Date.now()
    handler(event.clientX, event.clientY)
  })
  el.addEventListener('click', (event) => {
    if (Date.now() - lastPointerAt < PRESS_CLICK_GUARD_MS) return
    const rect = el.getBoundingClientRect()
    handler(event.clientX || rect.left + rect.width / 2, event.clientY || rect.top + rect.height / 2)
  })
}

/** Каждый палец — своя клавиша/струна и своё глиссандо (аккорды на пианино). */
function bindGlissando(
  overlay: HTMLElement,
  selector: string,
  onKey: (btn: HTMLButtonElement, event: PointerEvent) => void,
): void {
  const lastByPointer = new Map<number, HTMLButtonElement | null>()

  const pick = (event: PointerEvent): HTMLButtonElement | null => {
    const raw = document.elementFromPoint(event.clientX, event.clientY)
    return raw?.closest<HTMLButtonElement>(selector) ?? null
  }

  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    try {
      overlay.setPointerCapture(event.pointerId)
    } catch {
      // jsdom / уже захвачен
    }
    const btn = pick(event)
    lastByPointer.set(event.pointerId, btn)
    if (btn) onKey(btn, event)
  })

  overlay.addEventListener('pointermove', (event) => {
    if (!lastByPointer.has(event.pointerId)) return
    const btn = pick(event)
    if (btn && btn !== lastByPointer.get(event.pointerId)) {
      lastByPointer.set(event.pointerId, btn)
      onKey(btn, event)
    }
  })

  const end = (event: PointerEvent) => {
    if (!lastByPointer.delete(event.pointerId)) return
    try {
      overlay.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
  }
  overlay.addEventListener('pointerup', end)
  overlay.addEventListener('pointercancel', end)
}

/** Маракас: каждый палец трясёт свой маракас; ведение пальцем — шорох. */
function bindMaraca(
  btn: HTMLButtonElement,
  onShake: (x: number, y: number) => void,
  onRustle: (x: number, y: number) => void,
): void {
  const active = new Map<number, { x: number; y: number; at: number }>()
  btn.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    try {
      btn.setPointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    active.set(event.pointerId, { x: event.clientX, y: event.clientY, at: Date.now() })
    onShake(event.clientX, event.clientY)
  })
  btn.addEventListener('pointermove', (event) => {
    const prev = active.get(event.pointerId)
    if (!prev) return
    const now = Date.now()
    const dist = Math.hypot(event.clientX - prev.x, event.clientY - prev.y)
    if (now - prev.at < MARACA_RUSTLE_MS || dist < MARACA_RUSTLE_MIN_PX) return
    active.set(event.pointerId, { x: event.clientX, y: event.clientY, at: now })
    onRustle(event.clientX, event.clientY)
  })
  const end = (event: PointerEvent) => {
    active.delete(event.pointerId)
  }
  btn.addEventListener('pointerup', end)
  btn.addEventListener('pointercancel', end)
  btn.addEventListener('click', (event) => {
    // Клавиатура: click без касания.
    if (event.detail === 0 && active.size === 0) {
      const rect = btn.getBoundingClientRect()
      onShake(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
  })
}

function pct(n: number): string {
  return `${(n * 100).toFixed(3)}%`
}

function layerButton(layer: LayerBox, extraClass: string, shadow: SoftShadow): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `${extraClass} touch-btn sound-world__hit`
  btn.style.left = pct(layer.left)
  btn.style.top = pct(layer.top)
  btn.style.width = pct(layer.width)
  btn.style.height = pct(layer.height)
  btn.style.zIndex = String(layer.z)
  btn.setAttribute('aria-label', layer.label)
  btn.dataset.sfxId = layer.sfxId
  btn.dataset.piece = layer.piece

  const img = document.createElement('img')
  img.className = 'sound-world__layer-art'
  img.src = instrumentPlayUrl(layer.file)
  img.alt = ''
  img.draggable = false
  img.setAttribute('aria-hidden', 'true')
  btn.append(img)
  addSoftShadow(img, [shadow])
  return btn
}

/** Убрать инструмент и остановить его анимации (колокольчик не качается и не звенит). */
export function unmountInstrumentView(stage: HTMLElement): void {
  const prev = stage.querySelector('.sound-world__instrument')
  if (!prev) return
  prev.dispatchEvent(new Event('sound-world-unmount'))
  prev.remove()
}

export function mountInstrumentView(stage: HTMLElement, opts: MountOpts): void {
  unmountInstrumentView(stage)

  const wrap = document.createElement('div')
  wrap.className = 'sound-world__instrument'
  wrap.dataset.instrumentId = opts.instrumentId

  const panel = document.createElement('div')
  panel.className = `sound-world__instrument-panel sound-world__instrument-panel--${opts.instrumentId}`
  wrap.append(panel)
  stage.append(wrap)

  const play = (sfxId: string, overlap = false, extra: InstrumentSfxOptions = {}) => {
    void playInstrumentSfx(opts.audio, sfxId, opts.sfxUrls, { ...extra, overlap })
  }

  const id = opts.instrumentId

  if (id === 'xylophone') {
    panel.classList.add('sound-world__instrument-panel--xylophone')
    for (let i = 0; i < XYLOPHONE_RATES.length; i += 1) {
      const bar = document.createElement('button')
      bar.type = 'button'
      bar.className = 'sound-world__xylo-bar touch-btn'
      bar.style.setProperty('--bar-i', String(i))
      bar.setAttribute('aria-label', `Планка ${i + 1}`)
      bindPress(bar, () => {
        play('bell', true, { playbackRate: XYLOPHONE_RATES[i] })
        pulse(bar, 'is-struck', 280)
      })
      panel.append(bar)
    }
    return
  }

  if (id === 'drum') {
    const scene = document.createElement('div')
    scene.className = 'sound-world__instrument-scene sound-world__drum-kit'
    scene.style.setProperty('--scene-ar', DRUM_SCENE_AR)
    const ground = document.createElement('div')
    ground.className = 'sound-world__drum-ground'
    ground.setAttribute('aria-hidden', 'true')
    const floor = document.createElement('div')
    floor.className = 'sound-world__drum-floor'
    floor.setAttribute('aria-hidden', 'true')
    floor.style.backgroundImage = `url("${instrumentPlayUrl('drum-floor')}")`
    scene.append(ground, floor)
    for (const layer of DRUM_LAYERS) {
      const btn = layerButton(
        layer,
        `sound-world__drum-pad sound-world__drum-pad--${layer.piece}`,
        DRUM_SHADOW,
      )
      bindPress(btn, (x, y) => {
        play(layer.sfxId, true)
        pulse(btn, 'is-hit', 520)
        spawnSoundWave(scene, x, y)
      })
      scene.append(btn)
    }
    panel.append(scene)
    return
  }

  if (id === 'maracas') {
    const scene = document.createElement('div')
    scene.className = 'sound-world__instrument-scene sound-world__instrument-scene--maracas'
    scene.style.setProperty('--scene-ar', MARACA_SCENE_AR)
    for (const layer of MARACA_LAYERS) {
      const btn = layerButton(
        layer,
        `sound-world__maraca sound-world__maraca--${layer.piece}`,
        MARACA_SHADOW,
      )
      bindMaraca(
        btn,
        (x, y) => {
          play(layer.sfxId, true)
          pulse(btn, 'is-shake', 700)
          spawnSoundWave(scene, x, y)
        },
        (x, y) => {
          play(layer.sfxId, true, { clipId: 'maracas-shake' })
          pulse(btn, 'is-shake', 700)
          spawnSoundWave(scene, x, y)
        },
      )
      scene.append(btn)
    }
    panel.append(scene)
    return
  }

  if (id === 'bell') {
    const frame = document.createElement('div')
    frame.className = 'sound-world__instrument-frame sound-world__instrument-frame--bell'

    const swing = document.createElement('div')
    swing.className = 'sound-world__instrument-art-box sound-world__bell-swing'
    const art = document.createElement('img')
    art.className = 'sound-world__instrument-art'
    art.src = instrumentPlayUrl('bell')
    art.alt = ''
    art.draggable = false
    art.setAttribute('aria-hidden', 'true')
    swing.append(art)
    addSoftShadow(art, [BELL_SHADOW])

    const hit = document.createElement('button')
    hit.type = 'button'
    hit.className = 'sound-world__bell touch-btn sound-world__hit'
    hit.setAttribute('aria-label', 'Колокольчик')
    hit.style.inset = '0'
    hit.style.width = '100%'
    hit.style.height = '100%'
    hit.style.left = '0'
    hit.style.top = '0'

    let pendulum: Pendulum = { angle: 0, vel: 0 }
    let raf = 0
    let lastT = 0
    let lastRing = 0

    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    wrap.addEventListener('sound-world-unmount', stop)

    const tick = (now: number) => {
      const dt = Math.min(0.032, lastT ? (now - lastT) / 1000 : 0.016)
      lastT = now
      const prevVel = pendulum.vel
      pendulum = stepPendulum(pendulum, dt)
      swing.style.transform = `rotate(${pendulum.angle * (180 / Math.PI)}deg)`
      if (pendulumShouldRing(prevVel, pendulum) && now - lastRing > 180) {
        lastRing = now
        play('bell', true)
        spawnSoundWave(frame, frame.getBoundingClientRect().left + frame.clientWidth / 2, frame.getBoundingClientRect().top + frame.clientHeight * 0.7)
      }
      if (pendulumAtRest(pendulum)) {
        pendulum = { angle: 0, vel: 0 }
        swing.style.transform = 'rotate(0deg)'
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    bindPress(hit, (x, y) => {
      play('bell', true)
      lastRing = performance.now()
      pendulum = pendulumImpulse(pendulum)
      spawnSoundWave(frame, x, y)
      if (!raf) {
        lastT = 0
        raf = requestAnimationFrame(tick)
      }
    })

    frame.append(swing, hit)
    panel.append(frame)
    return
  }

  if (id === 'piano') {
    const scene = document.createElement('div')
    scene.className = 'sound-world__piano-scene'
    scene.style.setProperty('--scene-ar', PIANO_SCENE_AR)

    const body = document.createElement('img')
    body.className = 'sound-world__piano-body'
    body.src = instrumentPlayUrl('piano-body')
    body.alt = ''
    body.draggable = false
    body.setAttribute('aria-hidden', 'true')
    scene.append(body)
    addSoftShadow(body, [PIANO_SHADOW])

    for (let i = 0; i < PIANO_NOTES.length; i += 1) {
      const row = PIANO_NOTES[i]!
      const slot = PIANO_KEY_SLOTS[i]!
      const layer = document.createElement('img')
      layer.className = 'sound-world__piano-key-art'
      layer.src = instrumentPlayUrl(`key-${i + 1}`)
      layer.alt = ''
      layer.draggable = false
      layer.setAttribute('aria-hidden', 'true')
      layer.dataset.keyIndex = String(i)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sound-world__piano-key touch-btn sound-world__hit'
      btn.style.left = pct(slot.x)
      btn.style.top = pct(slot.y)
      btn.style.width = pct(slot.w)
      btn.style.height = pct(slot.h)
      btn.setAttribute('aria-label', row.note)
      btn.dataset.sfxId = row.sfxId
      btn.dataset.note = row.note
      btn.dataset.keyIndex = String(i)
      scene.append(layer, btn)
    }

    const lid = document.createElement('img')
    lid.className = 'sound-world__piano-lid'
    lid.src = instrumentPlayUrl('piano-lid')
    lid.alt = ''
    lid.draggable = false
    lid.setAttribute('aria-hidden', 'true')
    scene.append(lid)

    bindGlissando(scene, '.sound-world__piano-key', (btn, event) => {
      play(btn.dataset.sfxId ?? 'piano', true)
      const idx = btn.dataset.keyIndex
      const art = scene.querySelector<HTMLElement>(
        `.sound-world__piano-key-art[data-key-index="${idx}"]`,
      )
      if (art) pulse(art, 'is-pressed', 240)
      pulse(btn, 'is-pressed', 240)
      spawnSoundWave(scene, event.clientX, event.clientY)
    })
    panel.append(scene)
    return
  }

  const frame = document.createElement('div')
  frame.className = 'sound-world__instrument-frame'

  const box = document.createElement('div')
  box.className = 'sound-world__instrument-art-box'

  const art = document.createElement('img')
  art.className = 'sound-world__instrument-art'
  art.src = instrumentPlayUrl(id)
  art.alt = ''
  art.draggable = false
  art.setAttribute('aria-hidden', 'true')

  const overlay = document.createElement('div')
  overlay.className = 'sound-world__instrument-hits'

  if (id === 'guitar') {
    for (let i = 0; i < 6; i += 1) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sound-world__guitar-string touch-btn sound-world__hit'
      btn.style.left = '0%'
      btn.style.top = `${40.2 + i * 3.15}%`
      btn.style.width = '78%'
      btn.style.height = '3.35%'
      btn.style.borderRadius = '999px'
      btn.setAttribute('aria-label', `Струна ${i + 1}`)
      btn.dataset.sfxId = `guitar-${i + 1}`
      overlay.append(btn)
    }
    bindGlissando(overlay, '.sound-world__guitar-string', (btn, event) => {
      play(btn.dataset.sfxId ?? 'guitar', true)
      pulse(btn, 'is-plucked', 420)
      spawnSoundWave(box, event.clientX, event.clientY)
    })
  }

  box.append(art, overlay)
  addSoftShadow(art, [INSTRUMENT_SHADOW])
  frame.append(box)
  panel.append(frame)
}
