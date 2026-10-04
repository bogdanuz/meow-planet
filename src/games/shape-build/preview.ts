import { SandboxWorld } from './physics'
import { placeRecipe, recipeHeight, recipeWidth, type Recipe } from './recipes'
import { drawFloorShadows, drawRope, drawScene, drawTie, drawWire } from './render'

const FLOOR = 30
const PAD = 0.5

/**
 * Мини-картинка машины для карточки «Что собрать»: детали стоят там же,
 * где их поставит «Построить», мир не запускается.
 */
export function drawRecipePreview(canvas: HTMLCanvasElement, recipe: Recipe, dpr: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = recipeWidth(recipe) + PAD * 2
  const height = Math.max(recipeHeight(recipe), 3) + PAD
  const top = FLOOR - height
  const world = new SandboxWorld({
    width,
    height: FLOOR + 1,
    floorY: FLOOR,
    ceilingY: top,
    realistic: false,
    autoStraight: true,
    sticky: false,
    random: () => 0.5,
  })
  placeRecipe(world, recipe, { cx: width / 2, floor: FLOOR, ceiling: top })
  const w = canvas.width / dpr
  const h = canvas.height / dpr
  const floorBand = 0.35
  const k = Math.min(w / width, h / (height + floorBand))
  const ox = (w - width * k) / 2
  const oy = h - (height + floorBand) * k
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * (oy - top * k))
  ctx.fillStyle = 'rgb(214 168 116 / 45%)'
  ctx.fillRect(-width, FLOOR, width * 3, floorBand + 1)
  const views = world.pieces()
  drawFloorShadows(ctx, views, FLOOR)
  for (const rope of world.ropes()) drawRope(ctx, rope)
  const ties = world.ties()
  const tied = new Set(ties.map((t) => t.balloonId))
  for (const tie of ties) drawTie(ctx, tie)
  drawScene(ctx, views, tied)
  for (const wire of world.wires()) drawWire(ctx, wire)
}
