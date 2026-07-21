/**
 * Rotate captcha — default settings, slide bg1 as source image.
 *
 * generate → write artefacts → validateRotateCaptcha.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1 } from '@/assets'
import { generateRotateCaptcha, validateRotateCaptcha } from '@/index'
import {
  casePaths,
  PNG_MAGIC,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

let data: Awaited<ReturnType<typeof generateRotateCaptcha>>

beforeAll(async () => {
  data = await generateRotateCaptcha({
    resources: { images: [bg1] },
  })
  writeBinary(paths, 'master.png', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'block.json', data.block)
})

describe('rotate/default — generate', () => {
  it('emits PNG master + thumb with the configured 220×220 size', () => {
    expect(data.masterImage.subarray(0, 4)).toEqual(PNG_MAGIC)
    expect(data.thumbImage.subarray(0, 4)).toEqual(PNG_MAGIC)
    expect(data.block.width).toBe(220)
    expect(data.block.height).toBe(220)
  })

  it('angle sits inside the default 30..330 range', () => {
    expect(data.block.angle).toBeGreaterThanOrEqual(30)
    expect(data.block.angle).toBeLessThanOrEqual(330)
  })

  it('thumb is smaller than master', () => {
    expect(data.thumbImage.length).toBeLessThan(data.masterImage.length)
  })
})

describe('rotate/default — validate', () => {
  // `validate` returns true when (userAngle + block.angle) % 360 is within
  // [360 - padding, 360] — i.e. between 355 and 360 at the default padding.
  // `userAngle = 360 - block.angle - padding` lands exactly at the lower
  // edge of that window.
  const PADDING = 5

  it('validates a rotation padded just inside the default tolerance', () => {
    const userAngle = 360 - data.block.angle - PADDING
    expect(validateRotateCaptcha(data.block, userAngle)).toBe(true)
  })

  it('rejects a rotation outside the default padding', () => {
    const userAngle = 360 - data.block.angle + 90
    expect(validateRotateCaptcha(data.block, userAngle)).toBe(false)
  })

  it('honours a custom padding', () => {
    // Wobble of 30° below the exact match: `(720 - 30) % 360 = 330`. With
    // padding 5 the window is [355, 360] — rejected. With padding 40 the
    // window is [320, 360] — accepted.
    const userAngle = 360 - data.block.angle - 30
    expect(validateRotateCaptcha(data.block, userAngle, 5)).toBe(false)
    expect(validateRotateCaptcha(data.block, userAngle, 40)).toBe(true)
  })
})
