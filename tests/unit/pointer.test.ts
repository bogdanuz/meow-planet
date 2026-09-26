import { afterEach, describe, expect, it } from 'vitest'
import { bindTapTap } from '../../src/shared/pointer'

describe('pointer tap-tap', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('выбирает источник и кладёт в цель', () => {
    const source = document.createElement('button')
    const target = document.createElement('div')
    document.body.append(source, target)

    const drops: string[] = []
    const ctl = bindTapTap([source], [target], {
      onDrop: (s, t) => {
        drops.push(`${s.tagName}->${t.tagName}`)
      },
    })

    source.click()
    expect(source.classList.contains('is-selected')).toBe(true)
    target.click()
    expect(drops).toEqual(['BUTTON->DIV'])
    expect(source.classList.contains('is-selected')).toBe(false)
    ctl.destroy()
  })

  it('повторный тап по источнику отменяет выбор', () => {
    const source = document.createElement('button')
    document.body.append(source)
    let cancelled = 0
    const ctl = bindTapTap([source], [], {
      onDrop: () => undefined,
      onCancel: () => {
        cancelled += 1
      },
    })
    source.click()
    source.click()
    expect(cancelled).toBe(1)
    expect(ctl.getSelected()).toBeNull()
    ctl.destroy()
  })
})
