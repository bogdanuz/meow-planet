import { getPieceSpec } from './pieces'
import type { PieceView } from './physics'

/** Глубина комнаты: кто кого закрывает и какие тени на полу. */

/** Выше этого над полом тени уже нет. */
const SHADOW_FADE = 3.5
const SHADOW_ALPHA = 0.26
/** Почти одинаковый низ — один «этаж», иначе соседи мигают друг поверх друга. */
const ROW_STEP = 0.05

function halfExtents(view: PieceView): { hw: number; hh: number } {
  const spec = getPieceSpec(view.kind)
  const c = Math.abs(Math.cos(view.angle))
  const s = Math.abs(Math.sin(view.angle))
  return {
    hw: ((c * spec.w + s * spec.h) / 2) * view.size,
    hh: ((s * spec.w + c * spec.h) / 2) * view.size,
  }
}

function bottomOf(view: PieceView): number {
  return view.y + halfExtents(view).hh
}

/** Снизу вверх: верхняя деталь ложится на верхнюю грань нижней. Список не меняем. */
export function paintOrder(views: readonly PieceView[]): PieceView[] {
  const row = new Map(views.map((v) => [v.id, Math.round(bottomOf(v) / ROW_STEP)]))
  return [...views].sort((a, b) => row.get(b.id)! - row.get(a.id)! || a.id - b.id)
}

export type FloorShadow = { x: number; y: number; rx: number; ry: number; alpha: number }

/** Мягкое пятно на полу под деталью; `null` — деталь на стене или слишком высоко. */
export function floorShadow(view: PieceView, floorY: number): FloorShadow | null {
  if (getPieceSpec(view.kind).fixed) return null
  const { hw, hh } = halfExtents(view)
  const lift = Math.max(0, floorY - (view.y + hh))
  if (lift >= SHADOW_FADE) return null
  const k = 1 - lift / SHADOW_FADE
  return {
    x: view.x,
    y: floorY,
    rx: hw * (0.6 + 0.45 * k),
    ry: Math.min(0.32, 0.1 + hw * 0.1) * (0.6 + 0.4 * k),
    alpha: SHADOW_ALPHA * k,
  }
}
