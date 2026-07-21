import type { RangeVal, Size } from '../internal/types'

/**
 * Configuration for {@link ClickCaptcha}.
 *
 * Mirrors the option categories in `go-captcha/v2/click` so the generated
 * output looks familiar to anyone migrating from the Go version.
 */
export type ClickMode = 'text' | 'shape'

export type { RangeVal, Size }

export interface Point {
  x: number
  y: number
}

export interface ClickOptions {
  /** Master image dimensions. Default 300×220. */
  imageSize: Size
  /** Composite alpha (0..1) applied to the master overlay. */
  imageAlpha: number
  /** Number of characters/shapes to draw on the master. */
  rangeLen: RangeVal
  /** Dot character sizes in px. */
  rangeSize: RangeVal
  /** Allowed rotation ranges in degrees (per dot). */
  rangeAnglePos: RangeVal[]
  /** Color palette for the master dots. */
  rangeColors: string[]
  /** Render a soft drop-shadow under each dot. */
  displayShadow: boolean
  /** Hex color of the drop-shadow. */
  shadowColor: string
  /** Shadow offset in px. */
  shadowPoint: Point

  /** Thumb image dimensions. Default 150×40. */
  thumbImageSize: Size
  /** How many dots the user must click (picked from the master). */
  rangeVerifyLen: RangeVal
  /** When true, every dot becomes a verify target. */
  disabledRangeVerifyLen: boolean
  /** Dot size range on the thumb (typically smaller than master). */
  rangeThumbSize: RangeVal
  /** Text color palette for the thumb. */
  rangeThumbColors: string[]
  /** Background-interference palette for the thumb. */
  rangeThumbBgColors: string[]
  /** Distortion intensity (0..5; higher = more warped). */
  thumbBgDistort: number
  /** Number of background circles in the thumb. */
  thumbBgCirclesNum: number
  /** Number of slim noise lines in the thumb. */
  thumbBgSlimLineNum: number
  /** Use the original shape color when true (no recoloring). */
  useShapeOriginalColor: boolean
  /** When true, thumb keeps the original aspect instead of squashing. */
  isThumbNonDeformAbility: boolean
}

/** Keys whose value is a nested object that must be merged, not replaced. */
const NESTED_KEYS = [
  'imageSize',
  'rangeLen',
  'rangeSize',
  'shadowPoint',
  'thumbImageSize',
  'rangeVerifyLen',
  'rangeThumbSize',
] as const

type NestedKey = (typeof NESTED_KEYS)[number]
type NestedValue = {
  [K in NestedKey]: ClickOptions[K]
}[NestedKey]

/**
 * Resolve a partial `Partial<ClickOptions>` against the defaults so every
 * nested object gets a deep merge, while arrays/booleans/numbers fall back
 * to the override or default untouched.
 */
export const resolveClickOptions = (
  override: Partial<ClickOptions> | undefined,
): ClickOptions => {
  const base = defaultOptions()
  if (!override) return base
  const merged: ClickOptions = { ...base, ...override }
  for (const key of NESTED_KEYS) {
    ;(merged[key] as NestedValue) = {
      ...base[key],
      ...override[key],
    } as NestedValue
  }
  return merged
}

const DEFAULTS: ClickOptions = {
  imageSize: { width: 300, height: 220 },
  imageAlpha: 1,
  rangeLen: { min: 6, max: 7 },
  rangeSize: { min: 26, max: 32 },
  rangeAnglePos: [
    { min: 20, max: 35 },
    { min: 35, max: 45 },
    { min: 45, max: 60 },
    { min: 290, max: 305 },
    { min: 305, max: 325 },
    { min: 325, max: 330 },
  ],
  rangeColors: [
    '#fde98e',
    '#60c1ff',
    '#fcb08e',
    '#fb88ff',
    '#b4fed4',
    '#cbfaa9',
    '#78d6f8',
  ],
  displayShadow: true,
  shadowColor: '#101010',
  shadowPoint: { x: -1, y: -1 },

  thumbImageSize: { width: 150, height: 40 },
  rangeVerifyLen: { min: 2, max: 4 },
  disabledRangeVerifyLen: false,
  rangeThumbSize: { min: 22, max: 28 },
  rangeThumbColors: [
    '#1f55c4',
    '#780592',
    '#2f6b00',
    '#910000',
    '#864401',
    '#675901',
    '#016e5c',
  ],
  rangeThumbBgColors: [
    '#1f55c4',
    '#780592',
    '#2f6b00',
    '#910000',
    '#864401',
    '#675901',
    '#016e5c',
  ],
  thumbBgDistort: 4,
  thumbBgCirclesNum: 24,
  thumbBgSlimLineNum: 2,
  useShapeOriginalColor: false,
  isThumbNonDeformAbility: true,
}

/** Read-only deep-copy of the defaults. */
export const defaultOptions = (): ClickOptions => ({
  ...DEFAULTS,
  imageSize: { ...DEFAULTS.imageSize },
  rangeLen: { ...DEFAULTS.rangeLen },
  rangeSize: { ...DEFAULTS.rangeSize },
  rangeAnglePos: DEFAULTS.rangeAnglePos.map((r) => ({ ...r })),
  rangeColors: [...DEFAULTS.rangeColors],
  shadowPoint: { ...DEFAULTS.shadowPoint },
  thumbImageSize: { ...DEFAULTS.thumbImageSize },
  rangeVerifyLen: { ...DEFAULTS.rangeVerifyLen },
  rangeThumbSize: { ...DEFAULTS.rangeThumbSize },
  rangeThumbColors: [...DEFAULTS.rangeThumbColors],
  rangeThumbBgColors: [...DEFAULTS.rangeThumbBgColors],
})

/** Shape-mode tweaks (mirrors go-captcha's `ModeShape` adjustments). */
export const applyShapeMode = (opts: ClickOptions): void => {
  opts.rangeLen = { min: 6, max: 7 }
  opts.rangeSize = { min: 24, max: 30 }
  opts.rangeThumbSize = { min: 14, max: 20 }
  opts.thumbBgDistort = 1
}
