import { describe, expect, it } from 'vitest'
import { createPoseSlot } from '../../src/shared/pose-slot'

describe('смена кадра без мигания', () => {
  it('старый кадр остаётся, пока новый не загрузился', () => {
    const img = document.createElement('img')
    img.className = 'pose'
    img.src = '/a.png'
    document.body.append(img)
    const slot = createPoseSlot(img)
    const under = document.querySelector<HTMLImageElement>('.pose.is-pose-under')
    expect(under).not.toBeNull()
    expect(img.style.opacity).not.toBe('0')

    slot.show('/b.png')
    expect(img.style.opacity).not.toBe('0')
    expect(under!.style.opacity).not.toBe('1')

    under!.dispatchEvent(new Event('load'))
    expect(under!.style.opacity).toBe('1')
    expect(img.style.opacity).toBe('0')
    expect(under!.getAttribute('src')).toContain('b.png')

    img.remove()
    under!.remove()
  })
})
