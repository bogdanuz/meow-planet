import type { AudioManager } from '../../shared/audio'
import { hubSoundUrl, playBalloonPopSound } from '../../shared/hub-sounds'
import type { Material } from './pieces'

/**
 * Звуки песочницы из общих «взял/положил» + тоны. Голоса нет (решение владельца):
 * эмоции «ух!» и «ура!» — короткие мелодии без слов.
 */

const MIN_GAP_MS = 55
let lastAt = 0

function throttled(): boolean {
  const now = performance.now()
  if (now - lastAt < MIN_GAP_MS) return true
  lastAt = now
  return false
}

function segment(audio: AudioManager, url: string, volume: number, rate: number, length = 0.5): void {
  void audio.playUrlSegment('sfx', url, 0, length, { volume, playbackRate: rate, stopPrevious: false, fadeOutSec: 0.08 })
}

function tones(audio: AudioManager, notes: readonly number[], gapMs: number, gain = 0.09, durationSec = 0.16): void {
  notes.forEach((freq, i) => {
    window.setTimeout(() => void audio.playTone(freq, { channel: 'sfx', durationSec, gain }), i * gapMs)
  })
}

/** Удар: дерево «тук», камень «бум», мячик «боинг». */
export function playImpact(audio: AudioManager, material: Material, strength: number): void {
  if (throttled()) return
  const v = 0.25 + strength * 0.6
  const drop = hubSoundUrl.drop()
  switch (material) {
    case 'stone':
      segment(audio, drop, Math.min(1, v * 1.3), 0.55, 0.7)
      return
    case 'rubber':
      tones(audio, [440, 660], 50, 0.06 + strength * 0.06, 0.12)
      return
    case 'air':
      tones(audio, [880], 0, 0.05, 0.1)
      return
    case 'spring':
      tones(audio, [330, 495, 660], 45, 0.08, 0.14)
      return
    case 'toy':
      segment(audio, drop, v, 1.3)
      return
    default:
      segment(audio, drop, v, 1.15)
  }
}

export function playSpawn(audio: AudioManager): void {
  segment(audio, hubSoundUrl.pickup(), 0.6, 1.25, 0.4)
}

/** Деталь вернулась в шкаф. */
export function playChpok(audio: AudioManager): void {
  segment(audio, hubSoundUrl.pickup(), 0.7, 1.7, 0.25)
  tones(audio, [700, 1050], 45, 0.06, 0.08)
}

/** «Заново»: всё улетает в шкаф. */
export function playWhoosh(audio: AudioManager): void {
  tones(audio, [1046, 880, 740, 622, 523, 440], 35, 0.05, 0.1)
}

export function playUndo(audio: AudioManager): void {
  tones(audio, [523, 784], 70, 0.07, 0.14)
}

/** «Бум!»: гул и подпрыгнули. */
export function playBoom(audio: AudioManager): void {
  segment(audio, hubSoundUrl.drop(), 1, 0.42, 0.9)
  tones(audio, [98, 82, 110], 90, 0.12, 0.28)
  window.setTimeout(() => playWhee(audio), 260)
}

/** «Ух!» — полетело. */
export function playWhee(audio: AudioManager): void {
  tones(audio, [523, 659, 784, 1046], 38, 0.06, 0.1)
}

/** «Ура!» — попал в кольцо. */
export function playHooray(audio: AudioManager): void {
  tones(audio, [523, 659, 784, 1046, 784, 1046], 90, 0.08, 0.18)
}

export function playPop(audio: AudioManager): void {
  playBalloonPopSound(audio)
}

export function playTurn(audio: AudioManager): void {
  tones(audio, [880, 1175], 50, 0.06, 0.08)
}

export function playResize(audio: AudioManager, bigger: boolean): void {
  tones(audio, bigger ? [392, 523, 659] : [659, 523, 392], 55, 0.06, 0.1)
}

export function playWand(audio: AudioManager, on: boolean): void {
  tones(audio, on ? [784, 988, 1175, 1568] : [1175, 988, 784, 587], 70, 0.08, 0.22)
}

export function playGravity(audio: AudioManager, off: boolean): void {
  tones(audio, off ? [392, 523, 659, 880] : [880, 659, 523, 392], 100, 0.07, 0.26)
}

/** Мотор детали включили / выключили: «вжик» вверх или вниз. */
export function playPower(audio: AudioManager, on: boolean): void {
  tones(audio, on ? [330, 440, 587] : [587, 440, 330], 50, 0.06, 0.12)
}

/** «Пуск!»: все механизмы заработали. */
export function playStart(audio: AudioManager, on: boolean): void {
  tones(audio, on ? [392, 523, 659, 784, 1046] : [784, 587, 392], 65, 0.07, 0.16)
}

/** Пушка «пух!». */
export function playCannon(audio: AudioManager): void {
  segment(audio, hubSoundUrl.drop(), 0.9, 0.5, 0.6)
  tones(audio, [196, 784, 1046], 40, 0.07, 0.12)
}

/** Верёвка тарана: короче — выше нота, длиннее — ниже. */
export function playRope(audio: AudioManager, shorter: boolean): void {
  tones(audio, shorter ? [523, 659] : [523, 392], 55, 0.06, 0.1)
}

/** «Дзынь» — тронул деталь, когда всё замерло. */
export function playChime(audio: AudioManager): void {
  if (throttled()) return
  tones(audio, [1568, 2093], 60, 0.045, 0.18)
}

/** «Чмок» — деталь прилипла. */
export function playStick(audio: AudioManager): void {
  segment(audio, hubSoundUrl.pickup(), 0.55, 0.8, 0.2)
  tones(audio, [660, 990], 40, 0.05, 0.07)
}

/** Кнопка «щёлк». */
export function playClick(audio: AudioManager): void {
  segment(audio, hubSoundUrl.pickup(), 0.5, 1.9, 0.15)
  tones(audio, [1318], 0, 0.05, 0.06)
}

/** Толкатель «бац!». */
export function playPunch(audio: AudioManager): void {
  segment(audio, hubSoundUrl.drop(), 0.8, 0.9, 0.35)
  tones(audio, [262, 392], 40, 0.06, 0.08)
}

/** Ракета «пш-ш-ш» вверх. */
export function playLaunch(audio: AudioManager): void {
  tones(audio, [262, 330, 392, 523, 659, 784, 1046], 60, 0.06, 0.14)
}

/** Ворота и люк: открылись — вниз, закрылись — вверх. */
export function playHatch(audio: AudioManager, open: boolean): void {
  tones(audio, open ? [494, 392, 330] : [330, 494], 55, 0.06, 0.1)
}

/** Искорка побежала по проводу: тихое «дзинь» — у каждого источника своя нота. */
export function playSignal(audio: AudioManager, note = 0): void {
  if (throttled()) return
  const base = [988, 1175, 1318, 1568][((note % 4) + 4) % 4]!
  tones(audio, [base, base * 1.5], 45, 0.035, 0.07)
}

/** Ножницы «чик-чик». */
export function playCut(audio: AudioManager): void {
  tones(audio, [2093, 1568, 2093], 60, 0.05, 0.05)
}

/** Пружина-катапульта «бойнг». */
export function playKick(audio: AudioManager): void {
  tones(audio, [196, 294, 440, 659], 35, 0.08, 0.12)
}

/** Ракета улетела за потолок. */
export function playGone(audio: AudioManager): void {
  tones(audio, [784, 1046, 1318, 1568], 80, 0.04, 0.16)
}

/** Труба: «бульк» — упало в одну, выпало из другой. */
export function playTeleport(audio: AudioManager): void {
  tones(audio, [392, 262, 523, 784], 50, 0.06, 0.1)
}

/** Пушка или ракета втянула предмет: «фьюют» сверху вниз и «чпок». */
export function playSuck(audio: AudioManager): void {
  tones(audio, [1318, 1046, 784, 587, 440, 880], 34, 0.06, 0.08)
}

/** Мяу или Олли здороваются после тапа. */
export function playHello(audio: AudioManager): void {
  tones(audio, [784, 988, 784], 90, 0.06, 0.12)
}

/** Мяу или Олли катается: радостное «и-и-и!». */
export function playRide(audio: AudioManager): void {
  tones(audio, [659, 784, 988, 1175, 988], 70, 0.05, 0.12)
}

/** Раскрылся парашют: мягкое «пуф» и плавно вниз. */
export function playChute(audio: AudioManager): void {
  tones(audio, [880, 784, 659, 587], 110, 0.045, 0.16)
}

/** Комната раздвинулась. */
export function playGrow(audio: AudioManager): void {
  if (throttled()) return
  tones(audio, [392, 494], 60, 0.035, 0.1)
}

export function playShutter(audio: AudioManager): void {
  tones(audio, [1046, 1318], 70, 0.08, 0.08)
}
