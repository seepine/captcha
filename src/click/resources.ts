import type { GraphImage } from '../internal/image-source'
import type { ImageSource } from '../internal/types'

/** A click captcha shape carries its own name so callers can use any string key. */
export interface ClickShape extends GraphImage {
  /** Logical name used to look this shape up. */
  name: string
}

/** Resource pools consumed by {@link ClickCaptcha}. */
export interface ClickResources {
  /** Background images for the master canvas. At least one required. */
  backgrounds: ImageSource[]
  /** Optional thumb-specific backgrounds. */
  thumbBackgrounds?: ImageSource[]
  /** Either characters (text mode) or shapes (shape mode). */
  chars?: string[]
  shapes?: ClickShape[]
  /** Fonts used for text mode. Any registered canvas font family works. */
  fonts?: string[]
}

const EMPTY: ClickResources = {
  backgrounds: [],
  chars: [],
}

/** Read-only defaults. */
export const defaultResources = (): ClickResources => ({
  backgrounds: [...EMPTY.backgrounds],
  chars: [...(EMPTY.chars ?? [])],
  shapes: [],
  fonts: [],
})

/** Surface a list of human-readable issues with the given resources. */
export const validateResources = (
  res: ClickResources,
  mode: 'text' | 'shape',
): string[] => {
  const errs: string[] = []
  if (res.backgrounds.length === 0) errs.push('no background images')
  if (mode === 'text') {
    if (!res.chars || res.chars.length === 0) errs.push('no chars provided')
    if (!res.fonts || res.fonts.length === 0) errs.push('no fonts provided')
  } else {
    if (!res.shapes || res.shapes.length === 0) errs.push('no shapes provided')
    for (const [i, s] of (res.shapes ?? []).entries()) {
      if (!s.maskImage) errs.push(`shapes[${i}].maskImage is empty`)
    }
  }
  return errs
}
