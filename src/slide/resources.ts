import type { GraphImage } from '../internal/image-source'
import type { ImageSource } from '../internal/types'

/** Collection of resources shared by all generated captchas of an instance. */
export interface SlideResources {
  /** Pool of background images; one is chosen randomly per generation. */
  backgrounds: ImageSource[]
  /** Pool of three-channel graph triples; one is chosen randomly per generation. */
  graphImages: GraphImage[]
}

/** Read-only defaults. */
export const defaultResources = (): SlideResources => ({
  backgrounds: [],
  graphImages: [],
})

/**
 * Validate that all required resources are loaded. Returns a list of human
 * readable issues so the caller can surface a meaningful error instead of a
 * null deref later.
 */
export const validateResources = (res: SlideResources): string[] => {
  const errs: string[] = []
  if (res.backgrounds.length === 0) errs.push('no background images')
  if (res.graphImages.length === 0) {
    errs.push('no graph images')
  } else {
    res.graphImages.forEach((g, i) => {
      if (!g.maskImage) errs.push(`graphImages[${i}].maskImage is empty`)
      if (!g.shadowImage) errs.push(`graphImages[${i}].shadowImage is empty`)
      if (!g.overlayImage) errs.push(`graphImages[${i}].overlayImage is empty`)
    })
  }
  return errs
}
