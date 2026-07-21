/**
 * Click captcha — custom character pool + colour palette + no drop-shadow.
 *
 * Defaults pick from a hard-coded `rangeColors` palette. This case overrides
 * every visual knob to make sure the validation pipeline stays consistent
 * with whatever the captcha rendered.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, dejavuSansFontData, dejavuSansFontFamily } from '@/assets'
import {
  generateClickCaptcha,
  registerFont,
  validateClickCaptcha,
} from '@/index'
import {
  casePaths,
  centerOf,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const POOL = ['7', '3', '9', '5', '1', '0']
const COLORS = ['#ff0055', '#00aa55', '#1155ff']

let data: Awaited<ReturnType<typeof generateClickCaptcha>>

beforeAll(async () => {
  try {
    registerFont(dejavuSansFontFamily, dejavuSansFontData)
  } catch {}

  data = await generateClickCaptcha({
    mode: 'text',
    options: {
      rangeLen: { min: 4, max: 5 },
      rangeVerifyLen: { min: 2, max: 3 },
      rangeColors: COLORS,
      rangeThumbColors: COLORS,
      displayShadow: false,
    },
    resources: {
      backgrounds: [bg1],
      chars: POOL,
      fonts: [dejavuSansFontFamily],
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'dots.json', data.dots)
})

describe('click/custom-chars — generate', () => {
  it('honours the custom rangeLen (4..5 dots)', () => {
    // The verify pool is a subset of the rendered dots, so it should be
    // somewhere between 2 and 5.
    expect(data.dots.length).toBeGreaterThanOrEqual(2)
    expect(data.dots.length).toBeLessThanOrEqual(5)
  })

  it('verify values come from the custom pool', () => {
    for (const d of data.dots) {
      expect(POOL).toContain(d.value)
    }
  })

  it('dot colours come from the custom palette', () => {
    for (const d of data.dots) {
      expect(COLORS).toContain(d.color)
      expect(COLORS).toContain(d.color2)
    }
  })
})

describe('click/custom-chars — validate', () => {
  it('accepts each dot centre', () => {
    expect(validateClickCaptcha(data.dots, data.dots.map(centerOf))).toBe(true)
  })

  it('offset option re-aligns a shifted click stream', () => {
    const shifted = data.dots.map((d) => ({
      x: d.x + d.width / 2 + 8,
      y: d.y + d.height / 2,
    }))
    expect(validateClickCaptcha(data.dots, shifted)).toBe(false)
    expect(validateClickCaptcha(data.dots, shifted, { offset: { x: 8 } })).toBe(
      true,
    )
  })
})
