import { describe, expect, it, vi } from 'vitest'
import {
  applySoftResult,
  softCheck,
  softError,
  softOk,
} from '../../src/shared/soft-error'

describe('soft-error', () => {
  it('softOk / softError', () => {
    expect(softOk()).toEqual({ ok: true })
    expect(softError('Попробуй ещё')).toEqual({
      ok: false,
      soft: true,
      message: 'Попробуй ещё',
    })
  })

  it('softCheck сравнивает без проигрыша', () => {
    expect(softCheck('red', 'red', 'не то')).toEqual({ ok: true })
    expect(softCheck('blue', 'red', 'Это синий. Ищем красный.')).toEqual({
      ok: false,
      soft: true,
      message: 'Это синий. Ищем красный.',
    })
  })

  it('applySoftResult вызывает подсказку только при soft', () => {
    const onHint = vi.fn()
    expect(applySoftResult(softOk(), onHint)).toBe(true)
    expect(onHint).not.toHaveBeenCalled()
    expect(applySoftResult(softError('Мягко'), onHint)).toBe(false)
    expect(onHint).toHaveBeenCalledWith('Мягко')
  })
})
