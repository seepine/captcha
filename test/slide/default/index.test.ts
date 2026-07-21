/**
 * Slide captcha — default settings.
 *
 * generate → write artefacts → validateSlideCaptcha.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, tile1Mask, tile1Shadow, tile1Overlay } from '@/assets'
import { generateSlideCaptcha, validateSlideCaptcha } from '@/index'
import {
  casePaths,
  JPEG_MAGIC,
  PNG_MAGIC,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const CANVAS = { width: 300, height: 220 } as const

let data: Awaited<ReturnType<typeof generateSlideCaptcha>>

beforeAll(async () => {
  data = await generateSlideCaptcha({
    resources: {
      backgrounds: [bg1],
      graphImages: [
        {
          maskImage: tile1Mask,
          shadowImage: tile1Shadow,
          overlayImage: tile1Overlay,
        },
      ],
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'tile.png', data.tileImage)
  writeJson(paths, 'block.json', data.block)
})

describe('slide/default — generate', () => {
  it('writes a JPEG master and a PNG tile', () => {
    expect(data.masterImage.subarray(0, 3)).toEqual(JPEG_MAGIC)
    expect(data.tileImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('returns a block inside the 300×220 canvas', () => {
    const { block } = data
    expect(block.width).toBe(block.height)
    expect(block.x).toBeGreaterThanOrEqual(0)
    expect(block.y).toBeGreaterThanOrEqual(0)
    expect(block.x + block.width).toBeLessThanOrEqual(CANVAS.width)
    expect(block.y + block.height).toBeLessThanOrEqual(CANVAS.height)
  })
})

describe('slide/default — validate', () => {
  it('accepts an exact match against (dx, dy)', () => {
    expect(validateSlideCaptcha(data.block, data.block.dx, data.block.dy)).toBe(
      true,
    )
  })

  it('accepts a small wobble inside the default 5px tolerance', () => {
    expect(
      validateSlideCaptcha(data.block, data.block.dx + 3, data.block.dy + 4),
    ).toBe(true)
  })

  it('rejects a drag far outside tolerance', () => {
    expect(
      validateSlideCaptcha(data.block, data.block.dx + 60, data.block.dy),
    ).toBe(false)
  })
})
