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
import { playInstrumentSfx } from './instrument-sfx'

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

function bindGlissando(
  overlay: HTMLElement,
  selector: string,
  onKey: (btn: HTMLButtonElement, event: PointerEvent) => void,
): void {
  let last: HTMLButtonElement | null = null
  let down = false

  const pick = (event: PointerEvent): HTMLButtonElement | null => {
    const raw = document.elementFromPoint(event.clientX, event.clientY)
    return raw?.closest<HTMLButtonElement>(selector) ?? null
  }

  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    down = true
    last = null
    overlay.setPointerCapture(event.pointerId)
    const btn = pick(event)
    if (btn) {
      last = btn
      onKey(btn, event)
    }
  })

  overlay.addEventListener('pointermove', (event) => {
    if (!down) return
    const btn = pick(event)
    if (btn && btn !== last) {
      last = btn
      onKey(btn, event)
    }
  })

  const end = (event: PointerEvent) => {
    if (!down) return
    down = false
    last = null
    try {
      overlay.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    overlay.querySelectorAll(`${selector}.is-pressed, ${selector}.is-plucked`).forEach((node) => {
      node.classList.remove('is-pressed', 'is-plucked')
    })
  }
  overlay.addEventListener('pointerup', end)
  overlay.addEventListener('pointercancel', end)
}

function pct(n: number): string {
  return `${(n * 100).toFixed(3)}%`
}

function layerButton(layer: LayerBox, extraClass: string): HTMLButtonElement {
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
  return btn
}

export function mountInstrumentView(stage: HTMLElement, opts: MountOpts): void {
  const prev = stage.querySelector('.sound-world__instrument')
  if (prev) {
    prev.dispatchEvent(new Event('sound-world-unmount'))
    prev.remove()
  }

  const wrap = document.createElement('div')
  wrap.className = 'sound-world__instrument'
  wrap.dataset.instrumentId = opts.instrumentId

  const panel = document.createElement('div')
  panel.className = `sound-world__instrument-panel sound-world__instrument-panel--${opts.instrumentId}`
  wrap.append(panel)
  stage.append(wrap)

  const play = (sfxId: string, overlap = false) => {
    void playInstrumentSfx(opts.audio, sfxId, opts.sfxUrls, { overlap })
  }

  const id = opts.instrumentId

  if (id === 'xylophone') {
    panel.classList.add('sound-world__instrument-panel--xylophone')
    for (let i = 0; i < 5; i += 1) {
      const bar = document.createElement('button')
      bar.type = 'button'
      bar.className = 'sound-world__xylo-bar touch-btn'
      bar.style.setProperty('--bar-i', String(i))
      bar.setAttribute('aria-label', `Планка ${i + 1}`)
      bar.addEventListener('click', () => {
        play('xylophone')
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
    for (const layer of DRUM_LAYERS) {
      const btn = layerButton(
        layer,
        `sound-world__drum-pad sound-world__drum-pad--${layer.piece}`,
      )
      btn.addEventListener('click', (event) => {
        play(layer.sfxId, true)
        pulse(btn, 'is-hit', 520)
        spawnSoundWave(scene, event.clientX, event.clientY)
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
      )
      btn.addEventListener('click', (event) => {
        play(layer.sfxId, true)
        pulse(btn, 'is-shake', 700)
        spawnSoundWave(scene, event.clientX, event.clientY)
      })
      scene.append(btn)
    }
    panel.append(scene)
    return
  }

  if (id === 'bell') {
    const frame = document.createElement('div')
    frame.className = 'sound-world__instrument-frame sound-world__instrument-frame--bell'

    const art = document.createElement('img')
    art.className = 'sound-world__instrument-art'
    art.src = instrumentPlayUrl('bell')
    art.alt = ''
    art.draggable = false
    art.setAttribute('aria-hidden', 'true')

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
      art.style.transform = `rotate(${pendulum.angle * (180 / Math.PI)}deg)`
      if (pendulumShouldRing(prevVel, pendulum) && now - lastRing > 180) {
        lastRing = now
        play('bell', true)
        spawnSoundWave(frame, frame.getBoundingClientRect().left + frame.clientWidth / 2, frame.getBoundingClientRect().top + frame.clientHeight * 0.7)
      }
      if (pendulumAtRest(pendulum)) {
        pendulum = { angle: 0, vel: 0 }
        art.style.transform = 'rotate(0deg)'
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    hit.addEventListener('click', (event) => {
      play('bell', true)
      lastRing = performance.now()
      pendulum = pendulumImpulse(pendulum)
      spawnSoundWave(frame, event.clientX, event.clientY)
      if (!raf) {
        lastT = 0
        raf = requestAnimationFrame(tick)
      }
    })

    frame.append(art, hit)
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
  frame.append(box)
  panel.append(frame)
}
