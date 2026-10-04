import type { HideSceneId } from './scenes'

const base = (): string => `${import.meta.env.BASE_URL ?? '/'}assets/games/hide-seek`

export const hideSceneUrl = (id: HideSceneId): string => `${base()}/scenes/${id}.webp`
export const hideThumbUrl = (id: HideSceneId): string => `${base()}/thumbs/${id}.webp`
export const hideItemUrl = (scene: HideSceneId, item: string): string => `${base()}/items/${scene}-${item}.png`

/** Озвучка владельца нарезана (150 mp3, `scripts/split-hide-seek-voice.mjs`); unit-тест сверяет файлы со списком. */
export const HIDE_SEEK_VOICE_READY = true

export function hideVoiceUrl(file: string, ready: boolean = HIDE_SEEK_VOICE_READY): string | null {
  return ready ? `${base()}/voice/${file}` : null
}
