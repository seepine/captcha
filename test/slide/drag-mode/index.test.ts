/**
 * Slide captcha — drag mode with a custom dead-zone direction.
 *
 * Default mode is `basic` (target sits on the left edge). This case drives
 * `mode: 'drag'` so the captcha picks a separate drop zone per generation,
 * then verifies the produced block against `validateSlideCaptcha` to make
 * sure the validator agrees with the random drop point.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { bg1, tile1Mask, tile1Shadow, tile1Overlay } from '@/assets'
import { generateSlideCaptcha, validateSlideCaptcha } from '@/index'
import { casePaths, writeBinary, writeJson } from '../../_helpers/artifacts'

const paths = casePaths(__dirname)

let data: Awaited<ReturnType<typeof generateSlideCaptcha>>

beforeAll(async () => {
  // Generate a few times — each pick a different dead-zone direction from
  // the supplied list, so we get coverage of `top` / `bottom` / `right` in
  // addition to the default `left`.
  data = await generateSlideCaptcha({
    mode: 'drag',
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
    options: {
      rangeDeadZoneDirections: ['top', 'bottom', 'right'],
      rangeGraphAnglePos: [{ min: 15, max: 25 }],
    },
  })
  writeBinary(paths, 'master.jpg', data.masterImage)
  writeBinary(paths, 'tile.png', data.tileImage)
  writeJson(paths, 'block.json', data.block)
})

describe('slide/drag-mode — generate', () => {
  it('uses the configured angle range', () => {
    expect(data.block.angle).toBeGreaterThanOrEqual(15)
    expect(data.block.angle).toBeLessThanOrEqual(25)
  })

  it('lands the drop point away from the left edge', () => {
    // In `basic` mode dx is always near 0; `drag` mode lets it move freely.
    expect(data.block.dx).toBeGreaterThan(5)
  })
})

describe('slide/drag-mode — validate', () => {
  it('validates exact (dx, dy)', () => {
    expect(validateSlideCaptcha(data.block, data.block.dx, data.block.dy)).toBe(
      true,
    )
  })

  it('offset applied to client-reported coordinates lines up', () => {
    // Pretend the client added +10 CSS px on the X axis. The validator's
    // offset option should accept the shifted target.
    const clientX = data.block.dx + 10
    expect(
      validateSlideCaptcha(data.block, clientX, data.block.dy, {
        offset: { x: 10 },
      }),
    ).toBe(true)
    // Without the offset, the same shifted click must be rejected.
    expect(validateSlideCaptcha(data.block, clientX, data.block.dy)).toBe(false)
  })
})
