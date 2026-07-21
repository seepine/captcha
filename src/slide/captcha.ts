import { createCanvas, type Canvas } from '@napi-rs/canvas'

import {
  type Block,
  type ImageSource,
  type SlideCaptchaData,
} from '../internal/types'
import {
  toImage,
  encodeJpeg,
  encodePng,
  type GraphImage,
} from '../internal/image-source'
import { jpegQuality, pickAngle } from '../internal/angle'
import { DrawImage, type DrawBlock } from '../internal/draw'
import { rotateCanvas } from '../internal/rotate'
import { pick, randInt, rangCutImagePos } from '../internal/random'
import {
  applyBasicMode,
  defaultOptions,
  resolveSlideOptions,
  type DeadZoneDirectionType,
  type Size,
  type SlideMode,
  type SlideOptions,
  type SlideOptionsInternal,
} from './options'
import {
  defaultResources,
  validateResources,
  type SlideResources,
} from './resources'

/**
 * One-shot slide captcha generator.
 *
 * `init.resources` is required — you bring the background and tile images.
 * The bundled assets are exposed via `@seepine/captcha/assets` (each export
 * is a base64 string).
 *
 * @example
 * ```ts
 * import { Buffer } from 'node:buffer'
 * import { generateSlideCaptcha } from '@seepine/captcha'
 * import { bg1, tile1Mask, tile1Shadow, tile1Overlay } from '@seepine/captcha/assets'
 *
 * const { masterImage, tileImage, block } = await generateSlideCaptcha({
 *   resources: {
 *     backgrounds: [bg1],
 *     graphImages: [{
 *       maskImage: tile1Mask,
 *       shadowImage: tile1Shadow,
 *       overlayImage: tile1Overlay,
 *     }],
 *   },
 * })
 * ```
 */
export const generateSlideCaptcha = (init: SlideCaptchaInit) =>
  new SlideCaptcha(init).generate()

/**
 * Verify a user-supplied drag target against the captcha's expected position.
 *
 * @param block     The `Block` returned by {@link SlideCaptcha.generate}.
 * @param targetX   Final X coordinate of the tile as the user dropped it (in master-image space).
 * @param targetY   Final Y coordinate of the tile as the user dropped it (in master-image space).
 * @param options   Optional tolerance configuration.
 *                  - `padding`: per-axis tolerance in px (default `5`).
 *                  - `offset`:  extra offset added to the expected position before comparing,
 *                               useful when the client reports coordinates in a different
 *                               coordinate space (e.g. after CSS scaling).
 * @returns `true` when the drag lands within the tolerance window on both axes.
 *
 * In practice the X axis carries the meaningful signal — the Y axis is fixed by
 * the captcha mode — but both are checked so callers can switch modes freely.
 */
export const validateSlideCaptcha = (
  block: Block,
  targetX: number,
  targetY: number,
  options: { padding?: number; offset?: { x?: number; y?: number } } = {},
): boolean => {
  const padding = options.padding ?? 5
  const offsetX = options.offset?.x ?? 0
  const offsetY = options.offset?.y ?? 0
  return (
    Math.abs(block.dx + offsetX - targetX) <= padding &&
    Math.abs(block.dy + offsetY - targetY) <= padding
  )
}

export type {
  Block,
  DeadZoneDirectionType,
  GraphImage,
  ImageSource,
  Size,
  SlideCaptchaData,
  SlideMode,
  SlideOptions,
  SlideResources,
}

/** Construction parameters for {@link SlideCaptcha}. */
export interface SlideCaptchaInit {
  /** Mode selector. Defaults to `basic`. */
  mode?: SlideMode
  /** Override individual options. Missing keys fall back to {@link defaultOptions}. */
  options?: Partial<SlideOptions>
  /** Resource pools the captcha draws from. Both must be non-empty. */
  resources: SlideResources
}

/**
 * Slide captcha generator.
 *
 * Usage:
 *   const c = new SlideCaptcha({ resources: { backgrounds, graphImages } });
 *   const data = await c.generate();
 *
 * Two modes are supported:
 *   - `basic`: tile drops back to its own row, drop zone sits on the left.
 *   - `drag`:  the tile is dragged into a separately-positioned drop zone.
 */
export class SlideCaptcha {
  private readonly opts: SlideOptionsInternal
  private readonly res: SlideResources
  private readonly mode: SlideMode
  private readonly draw = new DrawImage()

  constructor(init: SlideCaptchaInit) {
    this.opts = {
      ...resolveSlideOptions(init.options),
      mode: init.mode ?? 'basic',
    }
    this.res = {
      backgrounds: init.resources.backgrounds,
      graphImages: init.resources.graphImages,
    }
    this.mode = this.opts.mode
    if (this.mode === 'basic') applyBasicMode(this.opts)
  }

  /** Read-only snapshot of the resolved options (handy for tests / debugging). */
  getOptions(): Readonly<SlideOptions> {
    const { mode: _mode, ...rest } = this.opts
    return rest
  }

  /** Read-only snapshot of the resources this captcha was constructed with. */
  getResources(): Readonly<SlideResources> {
    return {
      backgrounds: [...this.res.backgrounds],
      graphImages: [...this.res.graphImages],
    }
  }

  /**
   * Generate a single captcha: a master JPEG (with the tile punched out) plus
   * a PNG tile to ship to the client.
   */
  async generate(): Promise<SlideCaptchaData> {
    const errs = validateResources(this.res)
    if (errs.length)
      throw new Error(`slide captcha resources invalid: ${errs.join('; ')}`)

    // 1. Decode sources. Each resource is a Buffer or a base64 string.
    const bg = await toImage(pick(this.res.backgrounds)!)

    const {
      maskImage: mask,
      shadowImage: shadow,
      overlayImage: overlay,
    } = pick(this.res.graphImages)!
    // `shadow`/`overlay` are decoded once up front so the same Image can be
    // re-used after rotation. We keep `mask` as a Canvas for drawTile.
    const shadowImg = await toImage(shadow)
    const overlayImg = await toImage(overlay)

    // 2. Randomly pick a block from the pool of candidates.
    const { blocks, tilePoint } = generateBlocks(this.opts)
    const block = pick(blocks)!

    // 3. Rotate the shadow + overlay so they match the block's angle.
    const size = block.width
    const shadowRot = rotatedAround(shadowImg, size, block.angle)
    const overlayRot = rotatedAround(overlayImg, size, block.angle)
    const maskImg = await toImage(mask)

    const drawBlock: DrawBlock = {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      angle: block.angle,
      image: shadowRot,
    }

    // 4. Compose master image: cropped background + rotated shadow.
    const croppedBg = await cropBackground(bg, this.opts.imageSize)
    const { canvas: master } = this.draw.drawMaster({
      width: this.opts.imageSize.width,
      height: this.opts.imageSize.height,
      background: croppedBg,
      blocks: [drawBlock],
    })

    // 5. Compose tile image: cropped background masked by the alpha mask, with overlay on top.
    const tileBg = createCanvas(size, size)
    tileBg.getContext('2d').drawImage(bg, -block.x, -block.y)
    const maskCanvas = createCanvas(size, size)
    maskCanvas.getContext('2d').drawImage(maskImg, 0, 0)

    const tile = this.draw.drawTile({
      width: size,
      height: size,
      background: tileBg,
      maskImage: maskCanvas,
      overlayImage: overlayRot,
      block: drawBlock,
    })

    // 6. Stamp target coordinates onto the block.
    block.dy = this.mode === 'basic' ? block.y : tilePoint.y
    block.dx = tilePoint.x

    return {
      masterImage: encodeJpeg(master, jpegQuality(this.opts.imageAlpha)),
      tileImage: encodePng(tile),
      block,
    }
  }
}

// -------------------------------------------------------------------------- //
// helpers
// -------------------------------------------------------------------------- //

/** Crop `bg` to `size`, picking a random offset when bg is larger. */
const cropBackground = async (
  bg: Awaited<ReturnType<typeof toImage>>,
  size: Size,
): Promise<Canvas> => {
  const pt = rangCutImagePos(size.width, size.height, bg.width, bg.height)
  const cvs = createCanvas(size.width, size.height)
  cvs.getContext('2d').drawImage(bg, -pt.x, -pt.y)
  return cvs
}

/** Rotate `img` to fit a square of `size`, with the original image centred. */
const rotatedAround = (
  img: Awaited<ReturnType<typeof toImage>>,
  size: number,
  angle: number,
): Canvas => {
  const cvs = createCanvas(img.width, img.height)
  cvs.getContext('2d').drawImage(img, 0, 0)
  return rotateCanvas(cvs, size, angle)
}

interface GeneratedBlocks {
  blocks: Block[]
  tilePoint: { x: number; y: number }
}

/**
 * Generate N candidate block positions and a target drop point.
 * Re-implementation of `genGraphBlocks` from go-captcha.
 */
const generateBlocks = (opts: SlideOptionsInternal): GeneratedBlocks => {
  const blocks: Block[] = []
  const { width, height } = opts.imageSize

  const randAngle = pickAngle(opts.rangeGraphAnglePos)
  const randSize = randInt(opts.rangeGraphSize.min, opts.rangeGraphSize.max)
  const cHeight = randSize
  const cWidth = randSize
  const dp = Math.floor(cWidth / 2)

  const dzdType = pickDirection(opts.rangeDeadZoneDirections, opts.mode)
  const blockWidth = Math.floor((width - cWidth - 20) / opts.genGraphNumber)
  let y = calcYWithDeadZone(5, height - cHeight - 5, cHeight, dzdType)

  for (let i = 0; i < opts.genGraphNumber; i++) {
    const [startRaw, endRaw] = calcXWithDeadZone(
      i * blockWidth + dp + 5,
      (i + 1) * blockWidth - dp,
      cWidth,
      dzdType,
    )
    // Clamp to the canvas — when genGraphNumber partitions the row too
    // tightly, the dead-zone adjusted range can land past the right edge
    // (or invert). Clamp before picking so the block stays inside the
    // master image.
    const lo = Math.min(startRaw, endRaw, width - cWidth)
    const hi = Math.max(startRaw, endRaw, lo)
    const start = Math.max(lo, dp + 5)
    const end = Math.max(hi, start)
    const x = randInt(start + 20, end + 20) - dp
    const block: Block = {
      x: Math.min(x, width - cWidth),
      y,
      width: cWidth,
      height: cHeight,
      angle: randAngle,
      dx: 0,
      dy: 0,
    }
    blocks.push(block)

    if (opts.enableGraphVerticalRandom) {
      y = calcYWithDeadZone(5, height - cHeight - 5, cHeight, dzdType)
      blocks[i]!.y = y
    }
  }

  const point = pickTilePoint(
    width,
    height,
    cWidth,
    cHeight,
    dzdType,
    opts.mode,
    y,
  )
  return { blocks, tilePoint: point }
}

const pickDirection = (
  dirs: DeadZoneDirectionType[],
  mode: SlideMode,
): DeadZoneDirectionType => {
  if (mode === 'basic') return 'left'
  return pick(dirs) ?? 'left'
}

const calcXWithDeadZone = (
  start: number,
  end: number,
  value: number,
  dzdType: DeadZoneDirectionType,
): [number, number] => {
  if (dzdType === 'left') return [start + value, end + value]
  return [start, end]
}

const calcYWithDeadZone = (
  start: number,
  end: number,
  value: number,
  dzdType: DeadZoneDirectionType,
): number => {
  if (dzdType === 'top') start += value
  else if (dzdType === 'bottom') end -= value
  return randInt(start, end)
}

const pickTilePoint = (
  width: number,
  height: number,
  cWidth: number,
  cHeight: number,
  dzdType: DeadZoneDirectionType,
  mode: SlideMode,
  fallbackY: number,
): { x: number; y: number } => {
  if (mode === 'basic') {
    return { x: randInt(5, Math.floor(cWidth / 2)), y: fallbackY }
  }
  switch (dzdType) {
    case 'top':
      return { x: randInt(5, width - cWidth - 5), y: 5 }
    case 'bottom':
      return { x: randInt(5, width - cWidth - 5), y: height - cHeight - 5 }
    case 'left':
      return { x: 5, y: randInt(5, height - cHeight - 5) }
    case 'right':
      return { x: width - cWidth - 5, y: randInt(5, height - cHeight - 5) }
  }
}
