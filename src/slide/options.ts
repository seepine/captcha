import type { RangeVal, Size } from '../internal/types'

/**
 * Configuration for {@link SlideCaptcha}.
 *
 * Mirrors the option categories in `go-captcha/v2/slide` so the generated
 * output looks familiar to anyone migrating from the Go version.
 */

/**
 * Direction in which the captcha drops its tile. The chosen direction
 * determines where the tile visually "leaves" the master and where the
 * "target slot" is placed.
 */
export type DeadZoneDirectionType = 'left' | 'right' | 'top' | 'bottom'

/**
 * Slide captcha mode.
 *
 * - `basic`:   the tile drops back to its own position. The "target" sits on
 *              the left edge.
 * - `drag`:    the tile is dragged into a separate drop zone chosen from the
 *              configured dead-zone directions.
 */
export type SlideMode = 'basic' | 'drag'

export type { RangeVal, Size }

export interface SlideOptions {
  /** Output image dimensions. */
  imageSize: Size
  /** Composite alpha (0..1) applied to overlays. */
  imageAlpha: number
  /** Allowed directions for the tile drop zone. */
  rangeDeadZoneDirections: DeadZoneDirectionType[]
  /** Tile size range, used to randomise the block's height/width. */
  rangeGraphSize: RangeVal
  /** Allowed rotation ranges, in degrees (picked uniformly per generation). */
  rangeGraphAnglePos: RangeVal[]
  /** Number of candidate blocks to generate per captcha; one is picked at random. */
  genGraphNumber: number
  /** When true, every block may randomise its Y instead of sharing one row. */
  enableGraphVerticalRandom: boolean
}

export interface SlideOptionsInternal extends SlideOptions {
  mode: SlideMode
}

/** Keys whose value is a nested object that must be merged, not replaced. */
const NESTED_KEYS = ['imageSize', 'rangeGraphSize'] as const

type NestedKey = (typeof NESTED_KEYS)[number]
type NestedValue = {
  [K in NestedKey]: SlideOptions[K]
}[NestedKey]

/**
 * Resolve a partial `Partial<SlideOptions>` against the defaults so every
 * nested object gets a deep merge, while arrays/booleans/numbers fall back
 * to the override or default untouched.
 */
export const resolveSlideOptions = (
  override: Partial<SlideOptions> | undefined,
): SlideOptions => {
  const base = defaultOptions()
  if (!override) return base
  const merged: SlideOptions = { ...base, ...override }
  for (const key of NESTED_KEYS) {
    ;(merged[key] as NestedValue) = {
      ...base[key],
      ...override[key],
    } as NestedValue
  }
  // `genGraphNumber` is documented as "must be > 1" by go-captcha; coerce.
  if (merged.genGraphNumber < 1) merged.genGraphNumber = 1
  return merged
}

/**
 * Defaults for slide captcha. Mirrors `defaultOptions()` in go-captcha so the
 * generated images look familiar to anyone migrating from go-captcha.
 */
const DEFAULTS: SlideOptions = {
  imageSize: { width: 300, height: 220 },
  imageAlpha: 1,
  rangeDeadZoneDirections: ['left', 'right', 'top', 'bottom'],
  rangeGraphSize: { min: 60, max: 70 },
  rangeGraphAnglePos: [{ min: 0, max: 0 }],
  genGraphNumber: 1,
  enableGraphVerticalRandom: false,
}

/** Read-only deep-copy of the defaults (callers must not mutate). */
export const defaultOptions = (): SlideOptions => ({
  ...DEFAULTS,
  imageSize: { ...DEFAULTS.imageSize },
  rangeDeadZoneDirections: [...DEFAULTS.rangeDeadZoneDirections],
  rangeGraphSize: { ...DEFAULTS.rangeGraphSize },
  rangeGraphAnglePos: DEFAULTS.rangeGraphAnglePos.map((r) => ({ ...r })),
})

/** Apply go-captcha's "ModeBasic" extra constraints on top of the defaults. */
export const applyBasicMode = (opts: SlideOptionsInternal): void => {
  opts.rangeDeadZoneDirections = ['left']
  opts.enableGraphVerticalRandom = false
}
