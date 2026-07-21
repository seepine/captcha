/**
 * Slide captcha — thumbnail background pool.
 *
 * Exercises the `thumb*` assets on @seepine/captcha/assets to confirm they
 * decode and feed the slide generator like the full-resolution `bg*` set.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  thumb1,
  thumb2,
  thumb3,
  thumb4,
  thumb5,
  tile1Mask,
  tile1Shadow,
  tile1Overlay,
} from '@/assets'
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
      backgrounds: [thumb1, thumb2, thumb3, thumb4, thumb5],
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

describe('slide/thumb — generate', () => {
  it('produces JPEG + PNG with the configured canvas size', () => {
    expect(data.masterImage.subarray(0, 3)).toEqual(JPEG_MAGIC)
    expect(data.tileImage.subarray(0, 4)).toEqual(PNG_MAGIC)
    expect(data.masterImage.length).toBeGreaterThan(0)
  })

  it('block fits inside the master canvas', () => {
    expect(data.block.x).toBeGreaterThanOrEqual(0)
    expect(data.block.y).toBeGreaterThanOrEqual(0)
    expect(data.block.x + data.block.width).toBeLessThanOrEqual(CANVAS.width)
    expect(data.block.y + data.block.height).toBeLessThanOrEqual(CANVAS.height)
  })
})

describe('slide/thumb — validate', () => {
  it('validates the exact (dx, dy) the captcha was generated for', () => {
    expect(validateSlideCaptcha(data.block, data.block.dx, data.block.dy)).toBe(
      true,
    )
  })

  it('honours a custom padding when verifying', () => {
    // 30px off — fails at default padding, passes at padding 40.
    const off = data.block.dx + 30
    expect(validateSlideCaptcha(data.block, off, data.block.dy)).toBe(false)
    expect(
      validateSlideCaptcha(data.block, off, data.block.dy, { padding: 40 }),
    ).toBe(true)
  })
})
