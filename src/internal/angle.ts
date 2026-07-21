import { createCanvas, type Canvas } from '@napi-rs/canvas'

import { pick, randInt } from './random'
import type { RangeVal } from './types'

/**
 * Pick a random angle in degrees from the first matching range, or `0` when
 * the pool is empty.
 */
export const pickAngle = (ranges: RangeVal[]): number => {
  const r = pick(ranges)
  if (!r) return 0
  return randInt(r.min, r.max)
}

/**
 * Convert composite alpha (0..1) to a JPEG quality bucket. Alpha of `1`
 * maps to quality 100; anything below clamps into the [40, 100] window.
 */
export const jpegQuality = (alpha: number): number => {
  if (alpha >= 1) return 100
  return Math.max(40, Math.min(100, Math.round(70 + alpha * 30)))
}

/**
 * Rotate `src` around the centre of a fresh `size`x`size` canvas. Used by
 * the click/rotate captchas (slide uses {@link rotateCanvas} because it
 * also scales).
 */
export const rotateAround = (
  src: Canvas,
  size: number,
  angle: number,
): Canvas => {
  const cvs = createCanvas(size, size)
  const ctx = cvs.getContext('2d')
  const rad = (angle * Math.PI) / 180
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rad)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return cvs
}
