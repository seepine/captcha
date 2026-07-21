/**
 * Rotate captcha — narrow angle range.
 *
 * Confirms the captcha respects the configured `rangeAnglePos` and that the
 * validator still agrees on the produced angle.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, bg2, bg3 } from '@/assets'
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
    options: {
      // Restrict the angle pool to two tight windows so the generated angle
      // is guaranteed to land in one of them.
      rangeAnglePos: [
        { min: 80, max: 100 },
        { min: 260, max: 280 },
      ],
    },
    resources: {
      images: [bg1, bg2, bg3],
    },
  })
  writeBinary(paths, 'master.png', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'block.json', data.block)
})

const inRanges = (angle: number): boolean =>
  (angle >= 80 && angle <= 100) || (angle >= 260 && angle <= 280)

describe('rotate/angle-ranges — generate', () => {
  it('emits PNG master + thumb', () => {
    expect(data.masterImage.subarray(0, 4)).toEqual(PNG_MAGIC)
    expect(data.thumbImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('angle lands inside one of the configured windows', () => {
    expect(inRanges(data.block.angle)).toBe(true)
  })
})

describe('rotate/angle-ranges — validate', () => {
  it('validates the produced angle with default padding', () => {
    // userAngle + block.angle must wrap into [355, 360] mod 360.
    const userAngle = 360 - data.block.angle - 5
    expect(validateRotateCaptcha(data.block, userAngle)).toBe(true)
  })

  it('handles a wider wobble when padding is widened', () => {
    // 15° under-rotation: wrapped sum is 345. Outside default padding (5 →
    // window [355, 360]) but inside padding 20 (window [340, 360]).
    const userAngle = 360 - data.block.angle - 15
    expect(validateRotateCaptcha(data.block, userAngle, 5)).toBe(false)
    expect(validateRotateCaptcha(data.block, userAngle, 20)).toBe(true)
  })

  it('rejects a rotation 180° off', () => {
    const userAngle = 360 - data.block.angle + 180
    expect(validateRotateCaptcha(data.block, userAngle, 5)).toBe(false)
  })
})
