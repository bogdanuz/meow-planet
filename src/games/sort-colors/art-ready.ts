/** Создаётся `npm run assets:sort-colors`: какие файлы игры уже нарисованы и озвучены. */
export const SORT_ART_READY = {
  toys: ['ball-red', 'ball-yellow', 'ball-blue', 'ball-green', 'cube-red', 'cube-yellow', 'cube-blue', 'cube-green', 'star-red', 'star-yellow', 'star-blue', 'star-green', 'pyramid-red', 'pyramid-yellow', 'pyramid-blue', 'pyramid-green', 'heart-red', 'heart-yellow', 'heart-blue', 'heart-green', 'duck-red', 'duck-yellow', 'duck-blue', 'duck-green', 'ring-red', 'ring-yellow', 'ring-blue', 'ring-green'] as readonly string[],
  bin: true,
  /** Ширина / высота bin.png; null — рисуем ящик-заглушку. */
  binAspect: 1.391 as number | null,
  stickers: true,
  background: true,
  voice: true,
  sfx: [] as readonly string[],
}
