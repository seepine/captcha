import { loadImage, type Canvas } from '@napi-rs/canvas'

import type { Base64String, ImageSource } from './types'

/**
 * Anything that can back a slide graph channel: a raw {@link Buffer} of image
 * bytes or a base64-encoded string of the same.
 */
export type Drawable = Buffer | Base64String

/**
 * The three image channels that compose a slide graph (the puzzle shape).
 *
 * - `maskImage`:    alpha mask (white = opaque, black = transparent).
 *                   Used both to punch the master image and to carve out the tile.
 * - `shadowImage`:  the "hole" appearance painted into the master image —
 *                   typically darker than the background so the user sees where
 *                   the missing piece goes.
 * - `overlayImage`: the actual artwork shown on the draggable tile.
 */
export interface GraphImage {
  maskImage: Drawable
  shadowImage: Drawable
  overlayImage: Drawable
}

/** Centralised so we can change the encoding strategy without touching callers. */
export const encodeJpeg = (canvas: Canvas, quality = 90): Buffer =>
  canvas.toBuffer('image/jpeg', quality)

export const encodePng = (canvas: Canvas): Buffer =>
  canvas.toBuffer('image/png')

/**
 * Decode any accepted {@link ImageSource} into a raw {@link Buffer}.
 * String inputs are assumed to be base64.
 */
export const toBuffer = (src: ImageSource): Buffer =>
  typeof src === 'string' ? Buffer.from(src, 'base64') : src

/**
 * Decode any accepted {@link ImageSource} into a canvas-ready image.
 * Strings are treated as base64 and converted to a Buffer first.
 */
export const toImage = async (
  src: ImageSource,
): Promise<Awaited<ReturnType<typeof loadImage>>> => loadImage(toBuffer(src))
