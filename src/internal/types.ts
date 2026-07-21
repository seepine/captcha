/**
 * Base64-encoded image payload. Treated as an image source alongside raw
 * {@link Buffer}s; the captcha decodes it on demand with `Buffer.from(s, 'base64')`.
 */
export type Base64String = string

/**
 * Source accepted by captcha constructors for backgrounds and graph tiles.
 *
 * - `Buffer`:        raw image bytes (PNG, JPEG, ...).
 * - `Base64String`:  base64-encoded image; internally converted to a Buffer.
 */
export type ImageSource = Buffer | Base64String

/**
 * Slide captcha output payload.
 *
 * - `masterImage`: the JPEG background image (with the tile shape punched out).
 * - `tileImage`: the PNG tile that should be dragged by the user.
 * - `block`: metadata describing both the original tile position and the
 *   target drop position (`dx`/`dy`).
 */
export interface SlideCaptchaData {
  masterImage: Buffer
  tileImage: Buffer
  block: Block
}

export interface RangeVal {
  min: number
  max: number
}

export interface Size {
  width: number
  height: number
}

/**
 * Position / size metadata for a single slide block.
 *
 * Coordinates follow the canvas origin (top-left).
 *
 * - `x`, `y`: position of the tile as drawn on the master image (masked out).
 * - `width`, `height`: tile size (square in basic mode).
 * - `angle`: rotation in degrees applied to the shape.
 * - `tileX` / `tileY`: deprecated aliases of `dx` / `dy`, kept for compatibility.
 * - `dx`, `dy`: where the user must drag the tile to in order to validate.
 */
export interface Block {
  x: number
  y: number
  width: number
  height: number
  angle: number
  /** Target X coordinate the user has to drag to. */
  dx: number
  /** Target Y coordinate the user has to drag to. */
  dy: number
}
