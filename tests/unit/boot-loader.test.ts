import { describe, expect, it } from 'vitest'
import { mountBootLoader } from '../../src/app/boot-loader'

describe('mountBootLoader', () => {
  it('обновляет процент и сообщение', () => {
    const root = document.createElement('div')
    const loader = mountBootLoader(root)
    expect(root.querySelector('.boot-loader')).not.toBeNull()
    expect(root.querySelector('.boot-loader__title')).toBeNull()
    expect(root.querySelector('.boot-loader__bg')?.getAttribute('src')).toContain(
      'welcome-bg.webp',
    )

    loader.setProgress({ percent: 42, message: 'Скачиваем игру…' })
    expect(root.querySelector('.boot-loader__percent')?.textContent).toBe('42%')
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe(
      'Скачиваем игру…',
    )

    loader.unmount()
    expect(root.querySelector('.boot-loader--leave')).not.toBeNull()
  })
})
