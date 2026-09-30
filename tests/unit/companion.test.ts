import { describe, expect, it } from 'vitest'
import {
  COMPANION_DEFAULT,
  presenterPoseUrl,
  visibleCompanion,
} from '../../src/shared/companion'

describe('companion', () => {
  it('по умолчанию выбирает сову', () => {
    expect(COMPANION_DEFAULT).toBe('olli')
  })

  it('сова использует свои кадры', () => {
    expect(visibleCompanion('olli')).toBe('olli')
    expect(presenterPoseUrl('olli', 'idle')).toContain('olli-idle.png')
    expect(presenterPoseUrl('meow', 'happy')).toContain('meow-presenter-happy.png')
  })
})
