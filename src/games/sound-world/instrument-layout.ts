export type LayerBox = {
  file: string
  sfxId: string
  label: string
  left: number
  top: number
  width: number
  height: number
  z: number
  piece: string
}

/**
 * Слева направо: снейр, бочка, том.
 * Нижние кромки на верхней плоскости подиума, чуть отступив от переднего края.
 */
export const DRUM_LAYERS: LayerBox[] = [
  {
    piece: 'kick',
    file: 'drum-kick',
    sfxId: 'drum-tom',
    label: 'Бочка',
    left: 0.26,
    top: 0.195,
    width: 0.48,
    height: 0.68,
    z: 1,
  },
  {
    piece: 'tom',
    file: 'drum-tom',
    sfxId: 'drum-right',
    label: 'Том',
    left: 0.58,
    top: 0.395,
    width: 0.32,
    height: 0.48,
    z: 2,
  },
  {
    piece: 'snare',
    file: 'drum-snare',
    sfxId: 'drum-snare',
    label: 'Малый барабан',
    left: 0.09,
    top: 0.375,
    width: 0.34,
    height: 0.5,
    z: 3,
  },
]

export const MARACA_LAYERS: LayerBox[] = [
  {
    piece: 'left',
    file: 'maraca-left',
    sfxId: 'maracas',
    label: 'Левый маракас',
    left: 0,
    top: 0,
    width: 0.449,
    height: 1,
    z: 1,
  },
  {
    piece: 'right',
    file: 'maraca-right',
    sfxId: 'maracas',
    label: 'Правый маракас',
    left: 0.554,
    top: 0,
    width: 0.446,
    height: 1,
    z: 1,
  },
]

export const DRUM_SCENE_AR = '16 / 10'
export const MARACA_SCENE_AR = '1369 / 1030'
export const PIANO_SCENE_AR = '2400 / 1792'

export type KeySlot = { x: number; y: number; w: number; h: number }

/** Непрозрачные области key-1…7 на общем холсте 2400×1792. */
export const PIANO_KEY_SLOTS: KeySlot[] = [
  { x: 0.1142, y: 0.3242, w: 0.1529, h: 0.365 },
  { x: 0.2175, y: 0.3309, w: 0.1396, h: 0.3644 },
  { x: 0.3263, y: 0.332, w: 0.1321, h: 0.365 },
  { x: 0.4442, y: 0.3359, w: 0.1167, h: 0.3633 },
  { x: 0.555, y: 0.3376, w: 0.1204, h: 0.3644 },
  { x: 0.6475, y: 0.3315, w: 0.1408, h: 0.361 },
  { x: 0.7413, y: 0.3382, w: 0.1438, h: 0.3365 },
]
