/**
 * Рука-подсказка «Собери что угодно!» (решения владельца 02.10.2026):
 * на входе — «толкни мяч» (если он ждёт на горке), потом «перетащи», пока
 * ребёнок сам не потащит деталь или не возьмёт её из шкафа; дальше — только
 * после ~10 с без касаний, по очереди «приглашения»; первый раз инструмент
 * или предмет — короткая подсказка сразу. Что и где показать рукой — решает экран.
 */

export type ToolHint = 'wand' | 'gravity' | 'photo' | 'balloon' | 'wrecking' | 'hoop' | 'fan' | 'hold'
export type InviteHint = 'push' | 'stack' | 'shelf' | 'boom'
export type HintId = 'drag' | InviteHint | ToolHint

export const COACH_IDLE_MS = 10_000
const INTRO_DELAY_MS = 800
const INTRO_REPEAT_MS = 4_000
const INVITES: readonly InviteHint[] = ['push', 'stack', 'shelf', 'boom']

type Due = { kind: 'intro' | 'idle' | 'tool'; hint: HintId }

export class SandboxCoach {
  private readonly now: () => number
  private readonly seen: Set<string>
  private introDone = false
  private pushPending = false
  private nextIntroAt = 0
  private lastTouch = 0
  private idleIndex = 0
  private paused = false
  private queue: ToolHint[] = []
  private current: Due | null = null

  constructor(opts: { now: () => number; seen: Set<string> }) {
    this.now = opts.now
    this.seen = opts.seen
  }

  /** `push` — на горке ждёт мяч: первая подсказка «толкни мяч». */
  start(opts: { push?: boolean } = {}): void {
    this.introDone = false
    this.pushPending = opts.push ?? false
    this.nextIntroAt = this.now() + INTRO_DELAY_MS
    this.lastTouch = this.now()
  }

  /** Мяч покатился — дальше вводная показывает «перетащи». */
  pushed(): void {
    this.pushPending = false
    this.nextIntroAt = Math.min(this.nextIntroAt, this.now())
  }

  /** Ребёнок сам перенёс деталь — вводная подсказка больше не нужна. */
  dragged(): void {
    this.introDone = true
    this.touched()
  }

  /** Взял деталь из шкафа тапом — тоже «понял». */
  took(): void {
    this.dragged()
  }

  touched(): void {
    this.lastTouch = this.now()
  }

  /** Сам подержал палец на детали и открыл меню — «подержи механизм» больше не нужна. */
  held(): void {
    this.forget('hold')
  }

  firstUse(hint: ToolHint): void {
    if (this.seen.has(hint) || this.queue.includes(hint)) return
    this.queue.push(hint)
  }

  setPaused(on: boolean): void {
    this.paused = on
    if (!on) this.lastTouch = this.now()
  }

  /** Какую подсказку показать сейчас (null — никакую). */
  due(): HintId | null {
    this.current = this.pick()
    return this.current?.hint ?? null
  }

  /** Экран начал показывать подсказку из `due()`. */
  shown(): void {
    const cur = this.take()
    if (!cur) return
    const now = this.now()
    if (cur.kind === 'tool') {
      this.forget(cur.hint as ToolHint)
      this.lastTouch = now
    } else if (cur.kind === 'intro') {
      this.nextIntroAt = now + INTRO_REPEAT_MS
    } else {
      this.idleIndex += 1
      this.lastTouch = now
    }
  }

  /** Подсказку из `due()` показать нельзя (нет нужной детали) — сразу следующая. */
  skip(): void {
    const cur = this.take()
    if (!cur) return
    if (cur.kind === 'tool') this.forget(cur.hint as ToolHint)
    else if (cur.kind === 'idle') this.idleIndex += 1
    else this.nextIntroAt = this.now() + INTRO_REPEAT_MS
  }

  private take(): Due | null {
    const cur = this.current ?? this.pick()
    this.current = null
    return cur
  }

  private forget(hint: ToolHint): void {
    this.queue = this.queue.filter((h) => h !== hint)
    this.seen.add(hint)
  }

  private pick(): Due | null {
    if (this.paused) return null
    const tool = this.queue[0]
    if (tool) return { kind: 'tool', hint: tool }
    const now = this.now()
    if (!this.introDone) {
      if (now < this.nextIntroAt) return null
      return { kind: 'intro', hint: this.pushPending ? 'push' : 'drag' }
    }
    if (now - this.lastTouch < COACH_IDLE_MS) return null
    return { kind: 'idle', hint: INVITES[this.idleIndex % INVITES.length]! }
  }
}
