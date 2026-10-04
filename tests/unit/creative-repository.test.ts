import { describe, expect, it } from 'vitest'
import { createMemoryCreativeRepository } from '../../src/games/drawing/creative-repository'
import type { CreativeWork } from '../../src/games/drawing/creative-works'

const sample: CreativeWork = {
  id: 'drawing-1',
  kind: 'drawing',
  createdAt: 1,
  updatedAt: 2,
  caption: '',
  status: 'draft',
  strokes: [],
  background: { kind: 'coloring', sceneId: 'apple' },
}

describe('creative repository', () => {
  it('помнит работы и фото только в памяти браузера', async () => {
    const repo = createMemoryCreativeRepository()
    await repo.put(sample)
    expect((await repo.list()).map((work) => work.id)).toEqual(['drawing-1'])
    expect((await repo.list())[0]?.background).toEqual({ kind: 'coloring', sceneId: 'apple' })
    const blob = new Blob(['photo'], { type: 'image/png' })
    await repo.putBlob('photo-1', blob)
    expect(await repo.getBlob('photo-1')).toBe(blob)
    await repo.remove('drawing-1')
    expect(await repo.list()).toEqual([])
    expect(await repo.getBlob('missing')).toBeNull()
  })

  it('удаляет картинку-миниатюру вместе с работой', async () => {
    const repo = createMemoryCreativeRepository([sample])
    await repo.putBlob('thumb-drawing-1', new Blob(['x']))
    await repo.removeBlob('thumb-drawing-1')
    expect(await repo.getBlob('thumb-drawing-1')).toBeNull()
  })
})
