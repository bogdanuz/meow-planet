import { GALLERY_STAR_KEYS, loadGalleryStars, markGalleryStar } from '../../shared/gallery-progress'
import { isPuzzleSceneId, type PuzzleSceneId } from './logic'

export const PUZZLE_SOLVED_KEY = GALLERY_STAR_KEYS.puzzle

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function loadSolvedScenes(storage: StorageLike = localStorage): Set<PuzzleSceneId> {
  return loadGalleryStars('puzzle', isPuzzleSceneId, storage)
}

export function markSceneSolved(id: PuzzleSceneId, storage: StorageLike = localStorage): Set<PuzzleSceneId> {
  markGalleryStar('puzzle', id, isPuzzleSceneId, storage)
  return loadSolvedScenes(storage)
}
