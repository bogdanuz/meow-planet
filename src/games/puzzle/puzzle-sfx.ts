import type { AudioManager } from '../../shared/audio'
import { playCelebrationTune } from '../../shared/hub-sounds'

/** Мелодия «картинка собрана» — общая с «Прятками». «Взял» и «положил» — общие файлы hub-sounds. */
export function playPuzzleComplete(audio: AudioManager): void {
  playCelebrationTune(audio)
}
