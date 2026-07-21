/**
 * Click captcha — Chinese characters via the bundled CJK font.
 *
 * Registers both the Latin (DejaVuSans) and CJK (WenQuanYi Micro Hei) font
 * families so the captcha can render mixed text.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  bg1,
  wqyFontData,
  wqyFontFamily,
  dejavuSansFontFamily,
  dejavuSansFontData,
} from '@/assets'
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

const POOL = new Set(['你', '好', '世', '界', '中', '文', 'A', 'B', '？', '，'])

let data: Awaited<ReturnType<typeof generateClickCaptcha>>

beforeAll(async () => {
  try {
    registerFont(wqyFontFamily, wqyFontData)
    registerFont(dejavuSansFontFamily, dejavuSansFontData)
  } catch {}

  data = await generateClickCaptcha({
    mode: 'text',
    resources: {
      backgrounds: [bg1],
      chars: [...POOL],
      fonts: [wqyFontFamily, dejavuSansFontFamily],
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'thumb.png', data.thumbImage)
  writeJson(paths, 'dots.json', data.dots)
})

describe('click/cjk — generate', () => {
  it('emits a JPEG master and a PNG thumb', () => {
    expect(data.masterImage.subarray(0, 3)).toEqual(JPEG_MAGIC)
    expect(data.thumbImage.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it('keeps the verify-dot values within the configured char pool', () => {
    expect(data.dots.length).toBeGreaterThanOrEqual(2)
    for (const d of data.dots) {
      expect(d.value.length).toBeGreaterThan(0)
      expect(POOL.has(d.value)).toBe(true)
    }
  })

  it('master image is well above the size of a flat background', () => {
    // Glyph rendering produces a JPEG well above 20 KB; an empty captcha
    // would compress to nearly nothing.
    expect(data.masterImage.length).toBeGreaterThan(20_000)
    expect(data.thumbImage.length).toBeGreaterThan(2_000)
  })
})

describe('click/cjk — validate', () => {
  it('accepts each dot centre click', () => {
    expect(validateClickCaptcha(data.dots, data.dots.map(centerOf))).toBe(true)
  })

  it('rejects clicks in the wrong order', () => {
    expect(
      validateClickCaptcha(data.dots, data.dots.map(centerOf).reverse()),
    ).toBe(false)
  })

  it('rejects when the click count differs', () => {
    expect(validateClickCaptcha(data.dots, [centerOf(data.dots[0]!)])).toBe(
      false,
    )
  })
})
