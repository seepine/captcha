import { createCanvas, type Canvas } from '@napi-rs/canvas'

import { encodePng, toImage } from '../internal/image-source'
import { pickAngle, rotateAround } from '../internal/angle'
import { pick, rangCutImagePos } from '../internal/random'
import { defaultOptions, validate, type RotateOptions } from './options'
import {
  defaultResources,
  validateResources,
  type RotateResources,
} from './resources'

export type { RotateOptions } from './options'
export type { RotateResources } from './resources'
export { validate as validateRotateAngle }

/**
 * One-shot rotate captcha generator.
 *
 * `init.resources.images` is required — the captcha picks one source image
 * and rotates it; the user must rotate the thumb back to match.
 *
 * @example
 * ```ts
 * import { Buffer } from 'node:buffer'
 * import { generateRotateCaptcha } from '@seepine/captcha'
 * import { bg1 } from '@seepine/captcha/assets'
 *
 * const { masterImage, thumbImage, block } = await generateRotateCaptcha({
 *   resources: { images: [Buffer.from(bg1, 'base64')] },
 * })
 * ```
 */
export const generateRotateCaptcha = (init: RotateCaptchaInit) =>
  new RotateCaptcha(init).generate()

/**
 * Verify a user-supplied rotation against the captcha's expected angle.
 *
 * The client measures how far the user rotated the thumb (in degrees, may be
 * negative). The server adds it back to the captcha's target angle and checks
 * whether the resulting rotation lands within `±padding` degrees of 360°.
 *
 * @param block      The `RotateBlock` returned by {@link RotateCaptcha.generate}.
 * @param userAngle  Rotation the user applied to the thumb, in degrees.
 * @param padding    Allowed tolerance in degrees (default `5`).
 * @returns `true` when the rotation lands within the tolerance window.
 */
export const validateRotateCaptcha = (
  block: RotateBlock,
  userAngle: number,
  padding = 5,
): boolean => validate(userAngle, block.angle, padding)

/** Block metadata returned alongside the captcha. */
export interface RotateBlock {
  /** Master square size (the user-facing canvas dimension). */
  width: number
  /** Master square size (kept for parity with go-captcha). */
  height: number
  /** Angle the thumb is rotated by in the master image, in degrees. */
  angle: number
}

/** Rotate captcha output. */
export interface RotateCaptchaData {
  /** Master image (PNG) — the rotated circle source. */
  masterImage: Buffer
  /** Thumb image (PNG) — the smaller circle the user rotates. */
  thumbImage: Buffer
  /** Block describing the captcha geometry. */
  block: RotateBlock
}

export interface RotateCaptchaInit {
  options?: Partial<RotateOptions>
  /** Resource pools the captcha draws from. `images` must be non-empty. */
  resources: RotateResources
}

/**
 * Rotate captcha generator.
 *
 * Usage:
 *   const captcha = new RotateCaptcha({ resources: { images } });
 *   const data = await captcha.generate();
 *
 * The master is a circular crop of the source image rotated by `block.angle`.
 * The thumb is a smaller circular crop at the same angle — the user must
 * rotate the thumb until it lines up.
 */
export class RotateCaptcha {
  private readonly opts: RotateOptions
  private readonly res: RotateResources

  constructor(init: RotateCaptchaInit) {
    this.opts = { ...defaultOptions(), ...init.options }
    this.res = { images: init.resources.images }
  }

  getOptions(): Readonly<RotateOptions> {
    return this.opts
  }

  getResources(): Readonly<RotateResources> {
    return { images: [...this.res.images] }
  }

  async generate(): Promise<RotateCaptchaData> {
    const errs = validateResources(this.res)
    if (errs.length)
      throw new Error(`rotate captcha resources invalid: ${errs.join('; ')}`)

    const src = await toImage(pick(this.res.images)!)
    const size = this.opts.imageSquareSize
    const thumbSize =
      pick(this.opts.rangeThumbImageSquareSize) ?? Math.floor(size * 0.7)
    const angle = pickAngle(this.opts.rangeAnglePos)

    return {
      masterImage: encodePng(
        drawCircle(src, size, angle, this.opts.thumbImageAlpha),
      ),
      thumbImage: encodePng(
        drawThumb(
          src,
          thumbSize,
          angle,
          (size - thumbSize) / 2,
          this.opts.thumbImageAlpha,
        ),
      ),
      block: { width: size, height: size, angle },
    }
  }
}

// -------------------------------------------------------------------------- //
// drawing
// -------------------------------------------------------------------------- //

const drawCircle = (
  src: Awaited<ReturnType<typeof toImage>>,
  size: number,
  angle: number,
  alpha: number,
): Canvas => {
  const pt = rangCutImagePos(size, size, src.width, src.height)
  const cvs = createCanvas(size, size)
  const ctx = cvs.getContext('2d')
  ctx.globalAlpha = alpha
  ctx.drawImage(src, -pt.x, -pt.y)

  // Crop into a circle.
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Rotate the resulting circle around its centre.
  return rotateAround(cvs, size, angle)
}

const drawThumb = (
  src: Awaited<ReturnType<typeof toImage>>,
  size: number,
  angle: number,
  scaleRatio: number,
  alpha: number,
): Canvas => {
  // Build a larger canvas so rotation has room.
  const full = createCanvas(size, size)
  const ctx = full.getContext('2d')
  ctx.globalAlpha = alpha
  ctx.drawImage(src, 0, 0)

  // Scale inward, then crop to a circle.
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  ctx.arc(
    size / 2,
    size / 2,
    Math.max(2, size / 2 - scaleRatio),
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  return rotateAround(full, size, angle)
}
