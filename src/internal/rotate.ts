import { createCanvas, type Canvas } from '@napi-rs/canvas'

/**
 * Produce a square canvas of `size` whose centre contains `src` rotated by
 * `angle` degrees. The source is drawn at its natural size centred, with
 * transparent surroundings. The result is auto-scaled so the rotated
 * bounding box still fits inside `size`.
 */
export const rotateCanvas = (
  src: Canvas,
  size: number,
  angle: number,
): Canvas => {
  const cvs = createCanvas(size, size)
  const ctx = cvs.getContext('2d')

  const rad = (angle * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const boundW = src.width * cos + src.height * sin
  const boundH = src.width * sin + src.height * cos
  const scale = Math.min(size / (boundW || 1), size / (boundH || 1), 1)

  ctx.translate(size / 2, size / 2)
  ctx.rotate(rad)
  ctx.scale(scale, scale)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)

  return cvs
}
