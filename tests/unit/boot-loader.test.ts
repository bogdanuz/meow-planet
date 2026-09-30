import { describe, expect, it } from 'vitest'
import { mountBootLoader } from '../../src/app/boot-loader'

describe('mountBootLoader', () => {
  it('монтирует утверждённую сцену уборки и связывает её с точным прогрессом', () => {
    const root = document.createElement('div')
    const loader = mountBootLoader(root)
    const layer = root.querySelector<HTMLElement>('.boot-loader')

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
    const owl = root.querySelector<HTMLElement>('.boot-loader__owl')
    expect(owl).not.toBeNull()
    expect(owl?.style.backgroundImage).toContain('boot-owl-vacuum.png')
    expect(owl?.style.backgroundImage).not.toContain('sprite')
    expect(root.querySelector('.boot-loader__leaves')).not.toBeNull()

    loader.setProgress({
      percent: 42,
      message: 'Подготавливаем игру',
      doneCount: 123,
      totalCount: 380,
    })
    expect(layer?.style.getPropertyValue('--boot-leaf-clear')).toBe('42%')
    expect(layer?.style.getPropertyValue('--boot-leaf-fade-start')).toBe('38%')
    expect(layer?.style.getPropertyValue('--boot-leaf-fade-end')).toBe('46%')
    expect(layer?.style.getPropertyValue('--boot-owl-left')).toBe('31.66%')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe(
      '123 из 380 файлов • 42%',
    )
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe(
      'Подготавливаем игру',
    )
    expect(
      root.querySelector('.boot-loader__meter')?.getAttribute('aria-valuenow'),
    ).toBe('42')

    loader.unmount()
    expect(root.querySelector('.boot-loader--leave')).not.toBeNull()
  })

  it('при ошибке сохраняет достигнутое место совы и показывает мягкий retry', () => {
    const root = document.createElement('div')
    const loader = mountBootLoader(root)
    const layer = root.querySelector<HTMLElement>('.boot-loader')

    loader.setProgress({
      percent: 57,
      message: 'Подготавливаем игру',
      doneCount: 57,
      totalCount: 100,
    })
    loader.setError(
      'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
    )

    expect(layer?.style.getPropertyValue('--boot-leaf-clear')).toBe('57%')
    expect(layer?.style.getPropertyValue('--boot-leaf-fade-start')).toBe('53%')
    expect(layer?.style.getPropertyValue('--boot-leaf-fade-end')).toBe('61%')
    expect(layer?.style.getPropertyValue('--boot-owl-left')).toBe('42.61%')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe(
      '57 из 100 файлов • 57%',
    )
    expect(root.querySelector('.boot-loader__message')?.textContent).toBe(
      'Пылесос сломался. Нажмите «Повторить», чтобы продолжить подготовку игр',
    )
    expect(
      (root.querySelector('.boot-loader__retry') as HTMLButtonElement).hidden,
    ).toBe(false)
    expect(layer?.classList.contains('boot-loader--error')).toBe(true)

    loader.setProgress({
      percent: 0,
      message: 'Подготавливаем игру',
      doneCount: 0,
      totalCount: 100,
    })
    expect(layer?.style.getPropertyValue('--boot-leaf-clear')).toBe('57%')
    expect(layer?.style.getPropertyValue('--boot-owl-left')).toBe('42.61%')
    expect(root.querySelector('.boot-loader__progress')?.textContent).toBe(
      '57 из 100 файлов • 57%',
    )
    expect(layer?.classList.contains('boot-loader--error')).toBe(false)
  })
})
