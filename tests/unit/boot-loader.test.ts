import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountBootLoader } from '../../src/app/boot-loader'

function mountInBody() {
  const root = document.createElement('div')
  document.body.append(root)
  const loader = mountBootLoader(root)
  const layer = root.querySelector<HTMLElement>('.boot-loader')!
  return { root, loader, layer }
}

describe('mountBootLoader', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('монтирует сцену: сова с пылесосом ждёт у кучи листьев, внизу полоска с листиком', () => {
    const { root, layer } = mountInBody()

    expect(layer).not.toBeNull()
    expect(root.querySelector('.boot-loader__bg')?.getAttribute('src')).toContain(
      'boot-forest-bg.webp',
    )
    expect(root.querySelector('.boot-loader__title')?.getAttribute('src')).toContain(
      'boot-title.png',
    )
    expect(root.querySelector('.boot-loader__title')?.getAttribute('alt')).toBe(
      'Установка и подготовка игр',
    )
    expect(root.querySelector('.boot-loader__caption')?.textContent).toBe(
      'Скачиваем один раз — потом можно играть без интернета',
    )
    expect(root.querySelector('.boot-loader__owl-art')?.getAttribute('src')).toContain(
      'boot-owl-vacuum.png',
    )
    expect(root.querySelectorAll('.boot-loader__lid')).toHaveLength(2)
    expect(root.querySelector('.boot-loader__leaves')?.getAttribute('src')).toContain(
      'boot-leaves.png',
    )
    expect(root.querySelector('.boot-loader__bar-leaf')?.getAttribute('src')).toContain(
      'boot-leaf.png',
    )
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe('0%')
  })

  it('полоска показывает только проценты, без «N из M файлов»', () => {
    const { root, loader, layer } = mountInBody()

    loader.setProgress({
      percent: 42,
      message: 'Подготавливаем игру',
      doneCount: 123,
      totalCount: 380,
    })

    expect(layer.style.getPropertyValue('--boot-progress')).toBe('0.42')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe('42%')
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe(
      'Подготавливаем игру',
    )
    const bar = root.querySelector('.boot-loader__bar')!
    expect(bar.getAttribute('role')).toBe('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('42')
    expect(bar.getAttribute('data-done')).toBe('123')
    expect(bar.getAttribute('data-total')).toBe('380')
    // Пока идёт загрузка, сова ждёт: листья целы.
    expect(layer.classList.contains('boot-loader--finale')).toBe(false)
  })

  it('при ошибке сохраняет достигнутый процент и показывает мягкий retry', () => {
    const { root, loader, layer } = mountInBody()

    loader.setProgress({
      percent: 57,
      message: 'Подготавливаем игру',
      doneCount: 57,
      totalCount: 100,
    })
    loader.setError('Связь прервалась.')

    expect(layer.style.getPropertyValue('--boot-progress')).toBe('0.57')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe('57%')
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe('Связь прервалась.')
    const retry = root.querySelector('.boot-loader__retry') as HTMLButtonElement
    expect(retry.hidden).toBe(false)
    expect(retry.textContent).toBe('Продолжить загрузку')
    expect(layer.classList.contains('boot-loader--error')).toBe(true)

    loader.setProgress({
      percent: 0,
      message: 'Подготавливаем игру',
      doneCount: 0,
      totalCount: 100,
    })
    expect(layer.style.getPropertyValue('--boot-progress')).toBe('0.57')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe('57%')
    expect(layer.classList.contains('boot-loader--error')).toBe(true)

    loader.setProgress({
      percent: 58,
      message: 'Подготавливаем игру',
      doneCount: 58,
      totalCount: 100,
    })
    expect(layer.classList.contains('boot-loader--error')).toBe(false)
    expect(retry.hidden).toBe(true)
  })

  it('кнопка «Продолжить загрузку» сразу убирает ошибку и пишет, что продолжаем', () => {
    const { root, loader } = mountInBody()
    let retried = 0
    loader.setRetryHandler(() => {
      retried += 1
    })
    loader.setError('Связь прервалась.')
    ;(root.querySelector('.boot-loader__retry') as HTMLButtonElement).click()

    expect(retried).toBe(1)
    expect(root.querySelector('.boot-loader--error')).toBeNull()
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe('Продолжаем загрузку…')
  })

  it('добавляется в контейнер, не стирая его содержимое', () => {
    const app = document.createElement('div')
    app.id = 'app'
    document.body.append(app)
    mountBootLoader(document.body)
    expect(app.isConnected).toBe(true)
    expect(document.body.querySelector(':scope > .boot-loader')).not.toBeNull()
  })

  it('финал: сова всасывает листья, потом экран плавно уходит поверх welcome', async () => {
    vi.useFakeTimers()
    const { root, loader, layer } = mountInBody()

    let finished = false
    const done = loader.finish().then(() => {
      finished = true
    })
    expect(layer.classList.contains('boot-loader--finale')).toBe(true)
    expect(layer.style.getPropertyValue('--boot-progress')).toBe('1')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe('100%')

    await vi.advanceTimersByTimeAsync(500)
    expect(finished).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    await done
    expect(layer.classList.contains('boot-loader--swept')).toBe(true)

    loader.unmount()
    expect(layer.isConnected).toBe(true)
    expect(layer.classList.contains('boot-loader--leave')).toBe(true)
    expect(root.contains(layer)).toBe(true)

    await vi.advanceTimersByTimeAsync(600)
    expect(layer.isConnected).toBe(false)
  })
})
