import type { RangeVal } from '../internal/types'

/**
 * Configuration for {@link RotateCaptcha}.
 *
 * Mirrors `go-captcha/v2/rotate`: a square master is paired with a smaller
 * square thumb. The user must rotate the thumb until the angle matches the
 * master within a tolerance.
 */
export type { RangeVal }

export interface RotateOptions {
  /** Master image square size in px (default 220). */
  imageSquareSize: number
  /** Allowed rotation ranges in degrees. */
  rangeAnglePos: RangeVal[]
  /** Allowed thumb square sizes; one is chosen at random per generation. */
  rangeThumbImageSquareSize: number[]
  /** Composite alpha (0..1) for the thumb. */
  thumbImageAlpha: number
}

const DEFAULTS: RotateOptions = {
  imageSquareSize: 220,
  rangeAnglePos: [{ min: 30, max: 330 }],
  rangeThumbImageSquareSize: [140, 150, 160, 170],
  thumbImageAlpha: 1,
}

export const defaultOptions = (): RotateOptions => ({
  imageSquareSize: DEFAULTS.imageSquareSize,
  rangeAnglePos: DEFAULTS.rangeAnglePos.map((r) => ({ ...r })),
  rangeThumbImageSquareSize: [...DEFAULTS.rangeThumbImageSquareSize],
  thumbImageAlpha: DEFAULTS.thumbImageAlpha,
})

/**
 * Validate a candidate rotation against the captcha's target angle.
 * `padding` is the tolerance in degrees (commonly 5–10).
 */
export const validate = (
  angle: number,
  targetAngle: number,
  padding: number,
): boolean => {
  const rotated = (angle + targetAngle) % 360
  const wrapped = rotated < 0 ? rotated + 360 : rotated
  return wrapped >= 360 - padding && wrapped <= 360 + padding
}
