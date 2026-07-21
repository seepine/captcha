import type { ImageSource } from '../internal/types'

/** Resource pools consumed by {@link RotateCaptcha}. */
export interface RotateResources {
  /** Pool of square images the captcha rotates. At least one required. */
  images: ImageSource[]
}

export const defaultResources = (): RotateResources => ({ images: [] })

export const validateResources = (res: RotateResources): string[] => {
  const errs: string[] = []
  if (res.images.length === 0) errs.push('no images')
  return errs
}
