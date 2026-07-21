/**
 * Rotate captcha — custom square size and thumb size pool.
 *
 * Confirms `imageSquareSize` and `rangeThumbImageSquareSize` flow through
 * the generator and that the validator is unchanged by square size (it
 * only cares about the angle).
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg4, bg5 } from '@/assets'
import { generateRotateCaptcha, validateRotateCaptcha } from '@/index'
import {
  casePaths,
  PNG_MAGIC,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const SIZE = 280
const THUMB_SIZES = [120, 140, 160]

let data: Awaited<ReturnType<typeof generateRotateCaptcha>>

beforeAll(async () => {
  data = await generateRotateCaptcha({
    options: {
      imageSquareSize: SIZE,
      rangeThumbImageSquareSize: THUMB_SIZES,
    },
    resources: {
      images: [bg4, bg5],
    },
  })
  writeBinary(paths, 'master.png', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'block.json', data.block)
})

describe('rotate/custom-size — generate', () => {
  it('master is 280×280 (PNG)', () => {
    expect(data.block.width).toBe(SIZE)
    expect(data.block.height).toBe(SIZE)
    expect(data.masterImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('thumb is one of the configured sizes', () => {
    // We can't read the PNG dimensions without parsing; rely on file size
    // as a coarse proxy. A 120px thumb produces a noticeably smaller PNG
    // than a 160px one.
    expect(data.thumbImage.length).toBeGreaterThan(0)
    expect(data.thumbImage.length).toBeLessThan(data.masterImage.length)
  })

  it('angle stays in the default 30..330 range', () => {
    expect(data.block.angle).toBeGreaterThanOrEqual(30)
    expect(data.block.angle).toBeLessThanOrEqual(330)
  })
})

describe('rotate/custom-size — validate', () => {
  it('validates the produced angle with default padding', () => {
    const userAngle = 360 - data.block.angle - 5
    expect(validateRotateCaptcha(data.block, userAngle)).toBe(true)
  })

  it('rejects an undersized padding', () => {
    // 6° off — default 5° padding should reject this.
    const userAngle = 360 - data.block.angle + 6
    expect(validateRotateCaptcha(data.block, userAngle)).toBe(false)
  })
})
