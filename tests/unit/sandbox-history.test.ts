import { describe, expect, it } from 'vitest'
import { UndoStack } from '../../src/games/shape-build/history'

describe('Собери что угодно! — шаги назад', () => {
  it('пусто — отменять нечего', () => {
    const stack = new UndoStack<string>()
    expect(stack.canUndo()).toBe(false)
    expect(stack.pop()).toBeUndefined()
  })

  it('отменяет с последнего шага', () => {
    const stack = new UndoStack<string>()
    stack.push('a')
    stack.push('b')
    expect(stack.canUndo()).toBe(true)
    expect(stack.pop()).toBe('b')
    expect(stack.pop()).toBe('a')
    expect(stack.canUndo()).toBe(false)
  })

  it('помнит не больше 20 шагов — самые старые забываются', () => {
    const stack = new UndoStack<number>()
    for (let i = 1; i <= 25; i += 1) stack.push(i)
    expect(stack.size()).toBe(20)
    let last = 0
    while (stack.canUndo()) last = stack.pop()!
    expect(last).toBe(6)
  })

  it('шаг можно забрать обратно (деталь вернули в шкаф сразу) и очистить всё', () => {
    const stack = new UndoStack<string>(5)
    stack.push('a')
    stack.push('b')
    stack.dropLast('a')
    expect(stack.size()).toBe(2)
    stack.dropLast('b')
    expect(stack.pop()).toBe('a')
    stack.push('c')
    stack.clear()
    expect(stack.canUndo()).toBe(false)
  })
})
