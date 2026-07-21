/**
 * Click captcha — text mode with bundled Latin font.
 *
 * generate → write artefacts → validateClickCaptcha.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, wqyFontFamily, wqyFontData } from '@/assets'
import {
  generateClickCaptcha,
  registerFont,
  validateClickCaptcha,
} from '@/index'
import {
  casePaths,
  centerOf,
  JPEG_MAGIC,
  PNG_MAGIC,
  writeBinary,
  writeJson,
} from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

const CANVAS = { width: 300, height: 220 } as const

let data: Awaited<ReturnType<typeof generateClickCaptcha>>

beforeAll(async () => {
  try {
    registerFont(wqyFontFamily, wqyFontData)
  } catch {}

  data = await generateClickCaptcha({
    mode: 'text',
    resources: {
      backgrounds: [bg1],
      chars: ['A', 'B', 'C', 'D', 'E', 'F'],
      fonts: [wqyFontFamily],
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'dots.json', data.dots)
})

describe('click/text — generate', () => {
  it('emits a JPEG master and a PNG thumb', () => {
    expect(data.masterImage.subarray(0, 3)).toEqual(JPEG_MAGIC)
    expect(data.thumbImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('returns at least 2 verify dots inside the canvas', () => {
    expect(data.dots.length).toBeGreaterThanOrEqual(2)
    for (const d of data.dots) {
      expect(d.x).toBeGreaterThanOrEqual(0)
      expect(d.y).toBeGreaterThanOrEqual(0)
      expect(d.x + d.width).toBeLessThanOrEqual(CANVAS.width)
      expect(d.y + d.height).toBeLessThanOrEqual(CANVAS.height)
      expect(d.value.length).toBeGreaterThan(0)
    }
  })
})

describe('click/text — validate', () => {
  it('accepts clicks at each dot centre', () => {
    expect(validateClickCaptcha(data.dots, data.dots.map(centerOf))).toBe(true)
  })

  it('rejects clicks in the wrong order', () => {
    expect(
      validateClickCaptcha(data.dots, data.dots.map(centerOf).reverse()),
    ).toBe(false)
  })

  it('rejects when the click count is wrong', () => {
    expect(validateClickCaptcha(data.dots, [centerOf(data.dots[0]!)])).toBe(
      false,
    )
  })

  it('applies an offset to compensate for client-side scaling', () => {
    const clicks = data.dots.map((d) => ({
      x: d.x + d.width / 2 + 10,
      y: d.y + d.height / 2,
    }))
    expect(validateClickCaptcha(data.dots, clicks)).toBe(false)
    expect(validateClickCaptcha(data.dots, clicks, { offset: { x: 10 } })).toBe(
      true,
    )
  })
})
