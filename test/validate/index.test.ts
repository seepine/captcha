/**
 * Unit tests for the validation helpers exported by `@seepine/captcha`.
 *
 * These don't render any images — they directly drive the validators with
 * synthesised payloads, so the suite stays fast and deterministic.
 */
import { describe, expect, it } from 'vitest'

import {
  validateClickCaptcha,
  validateRotateCaptcha,
  validateSlideCaptcha,
  type Block,
  type ClickDot,
  type RotateBlock,
} from '@/index'

const block: Block = {
  x: 10,
  y: 20,
  width: 60,
  height: 60,
  angle: 0,
  dx: 120,
  dy: 20,
}

describe('validateSlideCaptcha', () => {
  it('accepts an exact match', () => {
    expect(validateSlideCaptcha(block, 120, 20)).toBe(true)
  })

  it('accepts a drag inside the default tolerance', () => {
    expect(validateSlideCaptcha(block, 124, 22)).toBe(true)
  })

  it('rejects a drag outside the default tolerance', () => {
    expect(validateSlideCaptcha(block, 130, 20)).toBe(false)
  })

  it('honours a custom padding', () => {
    expect(validateSlideCaptcha(block, 140, 20, { padding: 25 })).toBe(true)
    expect(validateSlideCaptcha(block, 140, 20, { padding: 5 })).toBe(false)
  })

  it('applies an optional offset before comparing', () => {
    // Without offset: 5px off → exactly at padding boundary, passes.
    expect(validateSlideCaptcha(block, 115, 20)).toBe(true)
    // With offset +6 the expected target moves to 126; 11px diff → fails.
    expect(validateSlideCaptcha(block, 115, 20, { offset: { x: 6 } })).toBe(
      false,
    )
    expect(validateSlideCaptcha(block, 122, 20, { offset: { x: 6 } })).toBe(
      true,
    )
  })

  it('checks both axes independently', () => {
    expect(validateSlideCaptcha(block, 120, 100)).toBe(false)
    expect(validateSlideCaptcha(block, 100, 20)).toBe(false)
  })
})

describe('validateRotateCaptcha', () => {
  const rb: RotateBlock = { width: 220, height: 220, angle: 90 }

  it('accepts a rotation that lands the combined angle near 360', () => {
    // (266 + 90) % 360 = 356, within default padding 5.
    expect(validateRotateCaptcha(rb, 266)).toBe(true)
  })

  it('accepts a small wobble inside the tolerance', () => {
    expect(validateRotateCaptcha(rb, 268, 5)).toBe(true)
  })

  it('rejects an out-of-tolerance wobble', () => {
    expect(validateRotateCaptcha(rb, 290, 5)).toBe(false)
  })

  it('honours a custom padding', () => {
    // (250 + 90) % 360 = 340 → within padding 25.
    expect(validateRotateCaptcha(rb, 250, 25)).toBe(true)
    // ...but outside default padding 5.
    expect(validateRotateCaptcha(rb, 250, 5)).toBe(false)
  })

  it('handles different target angles', () => {
    // angle 300 → user must rotate by ~56 (so 56 + 300 = 356).
    const rbNeg: RotateBlock = { width: 220, height: 220, angle: 300 }
    expect(validateRotateCaptcha(rbNeg, 56)).toBe(true)
  })
})

describe('validateClickCaptcha', () => {
  const dots: ClickDot[] = [
    {
      index: 0,
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      size: 30,
      angle: 0,
      color: '#000',
      color2: '#000',
      value: 'A',
    },
    {
      index: 1,
      x: 100,
      y: 50,
      width: 40,
      height: 40,
      size: 40,
      angle: 0,
      color: '#000',
      color2: '#000',
      value: 'B',
    },
    {
      index: 2,
      x: 200,
      y: 80,
      width: 20,
      height: 20,
      size: 20,
      angle: 0,
      color: '#000',
      color2: '#000',
      value: 'C',
    },
  ]

  it('accepts clicks that hit each dot centre exactly', () => {
    // Centres: (25, 25), (120, 70), (210, 90)
    expect(
      validateClickCaptcha(dots, [
        { x: 25, y: 25 },
        { x: 120, y: 70 },
        { x: 210, y: 90 },
      ]),
    ).toBe(true)
  })

  it('accepts clicks within tolerance', () => {
    expect(
      validateClickCaptcha(dots, [
        { x: 27, y: 26 },
        { x: 118, y: 74 },
        { x: 207, y: 88 },
      ]),
    ).toBe(true)
  })

  it('rejects a click outside tolerance', () => {
    expect(
      validateClickCaptcha(dots, [
        { x: 25, y: 25 },
        { x: 200, y: 70 }, // far from B's centre
        { x: 210, y: 90 },
      ]),
    ).toBe(false)
  })

  it('rejects a wrong number of clicks', () => {
    expect(validateClickCaptcha(dots, [{ x: 25, y: 25 }])).toBe(false)
    expect(
      validateClickCaptcha(dots, [
        { x: 25, y: 25 },
        { x: 120, y: 70 },
        { x: 210, y: 90 },
        { x: 0, y: 0 },
      ]),
    ).toBe(false)
  })

  it('enforces ordering', () => {
    // First two clicks are swapped.
    expect(
      validateClickCaptcha(dots, [
        { x: 120, y: 70 },
        { x: 25, y: 25 },
        { x: 210, y: 90 },
      ]),
    ).toBe(false)
  })

  it('honours a custom padding', () => {
    // 30px off — fails at default 5, passes at padding 40.
    expect(
      validateClickCaptcha(dots, [
        { x: 55, y: 25 },
        { x: 120, y: 70 },
        { x: 210, y: 90 },
      ]),
    ).toBe(false)
    expect(
      validateClickCaptcha(
        dots,
        [
          { x: 55, y: 25 },
          { x: 120, y: 70 },
          { x: 210, y: 90 },
        ],
        {
          padding: 40,
        },
      ),
    ).toBe(true)
  })

  it('applies an optional offset before comparing', () => {
    // Each user click is shifted by +10x relative to the expected centre.
    const userClicks = [
      { x: 35, y: 25 },
      { x: 130, y: 70 },
      { x: 220, y: 90 },
    ]
    // Without offset the 10px shift is outside the default 5px tolerance.
    expect(validateClickCaptcha(dots, userClicks)).toBe(false)
    // offset.x = +10 nudges the expected target up to 35, 130, 220 → exact match.
    expect(validateClickCaptcha(dots, userClicks, { offset: { x: 10 } })).toBe(
      true,
    )
  })
})
