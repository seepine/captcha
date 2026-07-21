/**
 * Slide captcha — exercise the full built-in graph pool and multi-block mode.
 *
 * `genGraphNumber > 1` lets the captcha pick among several candidate blocks
 * per call. The library still returns a single chosen block, and the
 * validator should accept it as the single correct drop point.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  bg1,
  tile1Mask,
  tile1Shadow,
  tile1Overlay,
  tile2Mask,
  tile2Shadow,
  tile2Overlay,
  tile3Mask,
  tile3Shadow,
  tile3Overlay,
  tile4Mask,
  tile4Shadow,
  tile4Overlay,
} from '@/assets'
import { generateSlideCaptcha, validateSlideCaptcha } from '@/index'
import { casePaths, writeBinary, writeJson } from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const ANGLES = [0, 30, 60, 90]
const TILES = [
  { mask: tile1Mask, shadow: tile1Shadow, overlay: tile1Overlay },
  { mask: tile2Mask, shadow: tile2Shadow, overlay: tile2Overlay },
  { mask: tile3Mask, shadow: tile3Shadow, overlay: tile3Overlay },
  { mask: tile4Mask, shadow: tile4Shadow, overlay: tile4Overlay },
].map((t) => ({
  maskImage: t.mask,
  shadowImage: t.shadow,
  overlayImage: t.overlay,
}))

let data: Awaited<ReturnType<typeof generateSlideCaptcha>>

beforeAll(async () => {
  data = await generateSlideCaptcha({
    options: {
      genGraphNumber: 4,
      enableGraphVerticalRandom: true,
      rangeGraphAnglePos: ANGLES.map((a) => ({ min: a, max: a })),
    },
    resources: {
      backgrounds: [bg1],
      graphImages: TILES,
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'tile.png', data.tileImage)
  writeJson(paths, 'block.json', data.block)
})

describe('slide/custom-tiles — generate', () => {
  it('picks one of the configured angles', () => {
    expect(ANGLES).toContain(data.block.angle)
  })

  it('block has non-zero size and stays inside the canvas', () => {
    expect(data.block.width).toBeGreaterThan(0)
    expect(data.block.height).toBeGreaterThan(0)
    expect(data.block.x + data.block.width).toBeLessThanOrEqual(300)
    expect(data.block.y + data.block.height).toBeLessThanOrEqual(220)
  })
})

describe('slide/custom-tiles — validate', () => {
  it('validates the exact drop target', () => {
    expect(validateSlideCaptcha(data.block, data.block.dx, data.block.dy)).toBe(
      true,
    )
  })

  it('rejects a target far from the drop zone on either axis', () => {
    expect(
      validateSlideCaptcha(data.block, data.block.dx + 200, data.block.dy),
    ).toBe(false)
    expect(
      validateSlideCaptcha(data.block, data.block.dx, data.block.dy + 200),
    ).toBe(false)
  })
})
