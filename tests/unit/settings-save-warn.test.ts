import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderSettingsForm } from '../../src/app/parent/settings-form'

describe('settings save warning', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('не вызывает onSaved, если запись в storage не удалась', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const host = document.createElement('div')
    const onSaved = vi.fn()
    renderSettingsForm(host, { onSaved, appVersion: '0.0.0' })
    host.querySelector<HTMLButtonElement>('#music-enabled')?.click()
    expect(onSaved).not.toHaveBeenCalled()
  })
})
