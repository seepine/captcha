/**
 * Click captcha — shape mode.
 *
 * Shape mode renders an outline tinted from the configured palette. Each
 * shape needs a `maskImage`; we reuse one of the slide tile masks as a
 * stand-in since the captcha only cares that the alpha channel decodes.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, tile1Mask, tile2Mask, tile3Mask, tile4Mask } from '@/assets'
import { generateClickCaptcha, validateClickCaptcha } from '@/index'
import {
  casePaths,
  centerOf,
  JPEG_MAGIC,
  PNG_MAGIC,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const SHAPE_NAMES = ['square', 'triangle', 'star', 'hex']

let data: Awaited<ReturnType<typeof generateClickCaptcha>>

beforeAll(async () => {
  const shapes = [
    { name: 'square', mask: tile1Mask },
    { name: 'triangle', mask: tile2Mask },
    { name: 'star', mask: tile3Mask },
    { name: 'hex', mask: tile4Mask },
  ].map(({ name, mask }) => ({
    name,
    maskImage: mask,
    shadowImage: mask,
    overlayImage: mask,
  }))

  data = await generateClickCaptcha({
    mode: 'shape',
    options: {
      rangeSize: { min: 3, max: 5 },
      rangeThumbSize: { min: 3, max: 5 },
    },
    resources: { backgrounds: [bg1], shapes },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'dots.json', data.dots)
})

describe('click/shape — generate', () => {
  it('emits JPEG master + PNG thumb', () => {
    expect(data.masterImage.subarray(0, 3)).toEqual(JPEG_MAGIC)
    expect(data.thumbImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('reports verify dots carrying the configured shape names', () => {
    expect(data.dots.length).toBeGreaterThanOrEqual(2)
    for (const d of data.dots) {
      expect(SHAPE_NAMES).toContain(d.value)
    }
  })
})

describe('click/shape — validate', () => {
  it('accepts the centre click for every dot', () => {
    expect(validateClickCaptcha(data.dots, data.dots.map(centerOf))).toBe(true)
  })

  it('rejects clicks that miss by more than padding', () => {
    const clicks = data.dots.map((d) => ({
      x: d.x + d.width / 2 + 50,
      y: d.y + d.height / 2,
    }))
    expect(validateClickCaptcha(data.dots, clicks)).toBe(false)
  })

  it('accepts larger misses when padding is widened', () => {
    const clicks = data.dots.map((d) => ({
      x: d.x + d.width / 2 + 20,
      y: d.y + d.height / 2,
    }))
    expect(validateClickCaptcha(data.dots, clicks, { padding: 30 })).toBe(true)
  })
})
