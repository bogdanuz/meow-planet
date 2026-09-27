import { describe, expect, it } from 'vitest'
import {
  buildKnownSfxUrls,
  buildSfxFileUrl,
  isAudioContentType,
} from '../../src/games/sound-world/sfx-url'

describe('sound-world sfx url', () => {
  it('не делает percent-encoding для letter-ru', () => {
    const url = buildSfxFileUrl('letter-ru-А', 'wav')
    expect(url).toContain('letter-ru-А.wav')
    expect(url).not.toContain('letter-ru-%D0%90.wav')
  })

  it('отсекает SPA fallback text/html при HEAD', () => {
    expect(isAudioContentType('text/html')).toBe(false)
    expect(isAudioContentType('text/html; charset=utf-8')).toBe(false)
    expect(isAudioContentType('audio/wav')).toBe(true)
    expect(isAudioContentType('audio/mpeg')).toBe(true)
  })

  it('собирает адрес из списка расширений, без проверки сети', () => {
    const urls = buildKnownSfxUrls(['cat', 'missing'], { cat: 'mp3', missing: 'txt' })
    expect(urls.get('cat')).toContain('cat.mp3')
    expect(urls.has('missing')).toBe(false)
  })
})
