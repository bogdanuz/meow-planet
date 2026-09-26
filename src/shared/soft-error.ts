/**
 * Soft-error: нет проигрыша и наказания — только спокойная подсказка.
 * См. идея продукта § soft-error / docs/11.
 */

export type SoftErrorResult = {
  ok: false
  soft: true
  message: string
}

export type SoftOkResult = {
  ok: true
}

export type SoftCheckResult = SoftOkResult | SoftErrorResult

export function softOk(): SoftOkResult {
  return { ok: true }
}

export function softError(message: string): SoftErrorResult {
  return { ok: false, soft: true, message }
}

/** Сравнение выбора с ожиданием без «fail». */
export function softCheck(
  actual: string,
  expected: string,
  hintMessage: string,
): SoftCheckResult {
  if (actual === expected) return softOk()
  return softError(hintMessage)
}

export function applySoftResult(
  result: SoftCheckResult,
  onSoftHint?: (message: string) => void,
): boolean {
  if (result.ok) return true
  onSoftHint?.(result.message)
  return false
}
