import { createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas'

import {
  toImage,
  encodeJpeg,
  encodePng,
  type GraphImage,
} from '../internal/image-source'
import { jpegQuality, pickAngle, rotateAround } from '../internal/angle'
import { pick, randInt, rangCutImagePos } from '../internal/random'
import {
  applyShapeMode,
  defaultOptions,
  resolveClickOptions,
  type ClickMode,
  type ClickOptions,
  type Point,
  type Size,
} from './options'
import {
  defaultResources,
  validateResources,
  type ClickResources,
} from './resources'

export type { ClickResources, ClickShape } from './resources'
export type { ClickOptions, ClickMode, RangeVal, Size, Point } from './options'

/**
 * One-shot click captcha generator (text or shape mode).
 *
 * `init.resources` is required. For text mode you must provide `chars`,
 * `fonts` (font family names registered via {@link registerFont}), and at
 * least one background. For shape mode you must provide `shapes` and at
 * least one background.
 *
 * @example
 * ```ts
 * import { generateClickCaptcha, registerFont } from '@seepine/captcha'
 * import { bg1, clickFont } from '@seepine/captcha/assets'
 *
 * // Register the bundled font once at process start. Accepts a base64 string
 * // or a raw Buffer / Uint8Array.
 * registerFont('MyFont', clickFont)
 *
 * const { masterImage, thumbImage, dots } = await generateClickCaptcha({
 *   mode: 'text',
 *   resources: {
 *     backgrounds: [bg1],
 *     chars: ['A', 'B', 'C', 'D', 'E', 'F'],
 *     fonts: ['MyFont'],
 *   },
 * })
 * ```
 */
export const generateClickCaptcha = (init: ClickCaptchaInit) =>
  new ClickCaptcha(init).generate()

/**
 * Verify a sequence of user clicks against the captcha's expected dot order.
 *
 * Each user click is compared to the centre of the corresponding dot using
 * Euclidean distance; the click is considered a hit when the distance falls
 * within `padding` pixels.
 *
 * @param dots        The `dots` array returned by {@link ClickCaptcha.generate}.
 * @param userClicks  Ordered list of click coordinates in master-image space.
 * @param options     Optional tolerance configuration.
 *                    - `padding`: per-click tolerance in px (default `5`).
 *                    - `offset`:  extra offset added to the expected dot centres
 *                                 before comparing, useful when the client reports
 *                                 coordinates in a different space (CSS scaling,
 *                                 retina ratios, etc.).
 * @returns `true` when the user clicked exactly `dots.length` points AND every
 *          click landed within the tolerance window.
 */
export const validateClickCaptcha = (
  dots: ClickDot[],
  userClicks: Array<{ x: number; y: number }>,
  options: { padding?: number; offset?: { x?: number; y?: number } } = {},
): boolean => {
  if (userClicks.length !== dots.length) return false
  const padding = options.padding ?? 5
  const offsetX = options.offset?.x ?? 0
  const offsetY = options.offset?.y ?? 0
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i]!
    const click = userClicks[i]!
    const cx = dot.x + dot.width / 2 + offsetX
    const cy = dot.y + dot.height / 2 + offsetY
    const dx = cx - click.x
    const dy = cy - click.y
    if (dx * dx + dy * dy > padding * padding) return false
  }
  return true
}

/** A single click target on the master and/or thumb image. */
export interface ClickDot {
  /** 0-based index assigned during generation. */
  index: number
  /** Master-image coordinate of the dot's top-left. */
  x: number
  /** Master-image coordinate of the dot's top-left. */
  y: number
  /** Dot width (px) after rotation. */
  width: number
  /** Dot height (px) after rotation. */
  height: number
  /** Square bounding box used during layout. */
  size: number
  /** Rotation in degrees applied at draw time. */
  angle: number
  /** Hex color used to draw the dot on the master. */
  color: string
  /** Hex color used to draw the dot on the thumb. */
  color2: string
  /** Original character (text mode) or shape name (shape mode). */
  value: string
}

/** Click captcha output. */
export interface ClickCaptchaData {
  /** Master image (JPEG) with the full set of dots. */
  masterImage: Buffer
  /** Thumb image (PNG) listing only the verify dots in order. */
  thumbImage: Buffer
  /** Subset of dots the user must click (in click order). */
  dots: ClickDot[]
}

export interface ClickCaptchaInit {
  mode?: ClickMode
  options?: Partial<ClickOptions>
  /** Resource pools the captcha draws from. `backgrounds` must be non-empty. */
  resources: ClickResources
}

/**
 * Click captcha generator.
 *
 * Usage:
 *   const captcha = new ClickCaptcha({ mode: 'text', resources });
 *   const data = await captcha.generate();
 *
 * Two modes:
 *   - `text`:  renders characters using registered canvas fonts.
 *   - `shape`: renders a shape mask tinted with a random palette colour.
 */
export class ClickCaptcha {
  private readonly opts: ClickOptions
  private readonly res: ClickResources
  private readonly mode: ClickMode

  constructor(init: ClickCaptchaInit) {
    this.opts = resolveClickOptions(init.options)
    this.res = {
      backgrounds: init.resources.backgrounds,
      thumbBackgrounds: init.resources.thumbBackgrounds,
      chars: init.resources.chars,
      shapes: init.resources.shapes,
      fonts: init.resources.fonts,
    }
    this.mode = init.mode ?? 'text'
    if (this.mode === 'shape') applyShapeMode(this.opts)
  }

  getOptions(): Readonly<ClickOptions> {
    return this.opts
  }

  getResources(): Readonly<ClickResources> {
    return {
      backgrounds: [...this.res.backgrounds],
      thumbBackgrounds: this.res.thumbBackgrounds
        ? [...this.res.thumbBackgrounds]
        : undefined,
      chars: this.res.chars ? [...this.res.chars] : undefined,
      shapes: this.res.shapes ? [...this.res.shapes] : undefined,
      fonts: this.res.fonts ? [...this.res.fonts] : undefined,
    }
  }

  async generate(): Promise<ClickCaptchaData> {
    const errs = validateResources(this.res, this.mode)
    if (errs.length)
      throw new Error(`click captcha resources invalid: ${errs.join('; ')}`)

    const bg = await toImage(pick(this.res.backgrounds)!)
    const dots = await this.buildDots()
    // After rotation, the bounding box may differ from its declared size.
    for (const d of dots) {
      d.width = d.canvas.width
      d.height = d.canvas.height
    }
    const verify = this.pickVerifyDots(dots)

    return {
      masterImage: encodeJpeg(
        drawMaster(this.opts.imageSize, bg, dots),
        jpegQuality(this.opts.imageAlpha),
      ),
      thumbImage: encodePng(drawThumb(this.opts, dots)),
      dots: verify,
    }
  }

  // ---------------------------------------------------------------------- //
  // dot construction
  // ---------------------------------------------------------------------- //

  private async buildDots(): Promise<InternalDot[]> {
    const length = randInt(this.opts.rangeLen.min, this.opts.rangeLen.max)
    const { width, height } = this.opts.imageSize
    const padding = 10
    const usableW = width - padding * 2
    const cell = Math.max(1, Math.floor(usableW / length))
    const dots: InternalDot[] = []

    for (let i = 0; i < length; i++) {
      const size = randInt(this.opts.rangeSize.min, this.opts.rangeSize.max)
      const angle = pickAngle(this.opts.rangeAnglePos)
      const color = pick(this.opts.rangeColors) ?? '#000000'
      const color2 = pick(this.opts.rangeThumbColors) ?? '#000000'
      const value =
        this.mode === 'shape'
          ? (pick(this.res.shapes ?? [])?.name ?? '')
          : (pick(this.res.chars ?? []) ?? '')
      const font = pick(this.res.fonts ?? []) ?? 'sans-serif'

      const rd = Math.abs(cell - size)
      const xx = i * cell + randInt(0, Math.max(rd, 1))
      const yy = randInt(
        padding,
        Math.max(padding + 1, height - size - padding),
      )
      const x = Math.min(
        Math.max(xx, padding),
        Math.max(padding, usableW - size),
      )
      const y =
        Math.min(
          Math.max(yy, size + padding),
          Math.max(size, height - size / 2),
        ) - size

      const canvas = await renderDotCanvas({
        value,
        size,
        angle,
        color,
        font,
        displayShadow: this.opts.displayShadow,
        shadowColor: this.opts.shadowColor,
        shadowPoint: this.opts.shadowPoint,
        shapes: this.res.shapes ?? [],
        mode: this.mode,
      })

      dots.push({
        index: i,
        x,
        y,
        width: size,
        height: size,
        size,
        angle,
        color,
        color2,
        value,
        canvas,
      })
    }
    return dots
  }

  private pickVerifyDots(dots: InternalDot[]): ClickDot[] {
    const perm = permute(dots.length)
    const count = this.opts.disabledRangeVerifyLen
      ? perm.length
      : randInt(this.opts.rangeVerifyLen.min, this.opts.rangeVerifyLen.max)
    const out: ClickDot[] = []
    for (let i = 0; i < perm.length && i < count; i++) {
      const idx = perm[i]!
      const d = dots[idx]!
      d.index = i
      out.push(stripCanvas(d))
    }
    return out
  }
}

// -------------------------------------------------------------------------- //
// helpers
// -------------------------------------------------------------------------- //

interface InternalDot extends ClickDot {
  canvas: Canvas
}

interface RenderDotParams {
  value: string
  size: number
  angle: number
  color: string
  font: string
  displayShadow: boolean
  shadowColor: string
  shadowPoint: Point
  shapes: Array<{ name?: string; maskImage: GraphImage['maskImage'] }>
  mode: ClickMode
}

/**
 * Paint a single dot onto `ctx`. Used twice per dot — once for the main
 * colour and (optionally) once for the drop-shadow.
 */
const paintDot = async (
  ctx: SKRSContext2D,
  p: RenderDotParams,
  color: string,
): Promise<void> => {
  const pad = 10
  const w = p.size + pad
  const h = p.size + pad

  if (p.mode === 'shape') {
    const shape = p.shapes.find((s) => s.name === p.value) ?? p.shapes[0]
    const mask = shape?.maskImage ? await toImage(shape.maskImage) : null
    if (!mask) return
    ctx.drawImage(mask, 0, 0, w, h)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
    return
  }

  ctx.fillStyle = color
  ctx.font = `${p.size}px ${p.font}`
  ctx.textBaseline = 'top'
  ctx.fillText(p.value, pad / 2, 0)
}

const renderDotCanvas = async (p: RenderDotParams): Promise<Canvas> => {
  const pad = 10
  const w = p.size + pad
  const h = p.size + pad
  const cvs = createCanvas(w, h)
  const ctx = cvs.getContext('2d')
  await paintDot(ctx, p, p.color)

  if (!p.displayShadow) {
    return rotateAround(cvs, Math.max(w, h), p.angle)
  }

  const shadow = createCanvas(w, h)
  await paintDot(shadow.getContext('2d'), p, p.shadowColor)

  const final = createCanvas(
    w + Math.abs(p.shadowPoint.x),
    h + Math.abs(p.shadowPoint.y),
  )
  const fctx = final.getContext('2d')
  fctx.drawImage(shadow, p.shadowPoint.x + pad / 2, p.shadowPoint.y + pad / 2)
  fctx.drawImage(cvs, pad / 2, pad / 2)
  return rotateAround(final, final.width, p.angle)
}

const permute = (n: number): number[] => {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

const stripCanvas = (d: InternalDot): ClickDot => ({
  index: d.index,
  x: d.x,
  y: d.y,
  width: d.width,
  height: d.height,
  size: d.size,
  angle: d.angle,
  color: d.color,
  color2: d.color2,
  value: d.value,
})

const drawMaster = (
  imageSize: Size,
  bg: Awaited<ReturnType<typeof toImage>>,
  dots: InternalDot[],
): Canvas => {
  const { width, height } = imageSize
  const pt = rangCutImagePos(width, height, bg.width, bg.height)
  const cvs = createCanvas(width, height)
  const ctx = cvs.getContext('2d')
  ctx.drawImage(bg, -pt.x, -pt.y)

  for (const d of dots) {
    ctx.drawImage(d.canvas, d.x, d.y)
  }
  return cvs
}

const drawThumb = (opts: ClickOptions, dots: InternalDot[]): Canvas => {
  const { width, height } = opts.thumbImageSize
  const cvs = createCanvas(width, height)
  const ctx = cvs.getContext('2d')

  // Background interference: circles + lines + jitter.
  for (let i = 0; i < opts.thumbBgCirclesNum; i++) {
    const r = randInt(1, 4)
    ctx.fillStyle = pick(opts.rangeThumbBgColors) ?? '#cccccc'
    ctx.beginPath()
    ctx.arc(randInt(r, width - r), randInt(r, height - r), r, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < opts.thumbBgSlimLineNum; i++) {
    ctx.strokeStyle = pick(opts.rangeThumbBgColors) ?? '#999999'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(randInt(0, width), randInt(0, height))
    ctx.lineTo(randInt(0, width), randInt(0, height))
    ctx.stroke()
  }
  distort(ctx, width, height, randInt(3, 6), 160)

  // Render verify dots horizontally across the thumb.
  const cell = width / dots.length
  for (let i = 0; i < dots.length; i++) {
    const d = dots[i]!
    const dx = Math.max(cell * i + cell / Math.max(d.canvas.width, 1), 8)
    const dy = randInt(1, Math.max(2, height - d.canvas.height - 4))
    ctx.drawImage(d.canvas, dx, dy)
  }
  return cvs
}

const distort = (
  ctx: SKRSContext2D,
  w: number,
  h: number,
  amp: number,
  freq: number,
): void => {
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  for (let y = 0; y < h; y++) {
    const offsetX = Math.sin((y / h) * freq) * amp
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w - 1, Math.max(0, x + Math.round(offsetX)))
      const di = (y * w + x) * 4
      const si = (y * w + sx) * 4
      data[di] = data[si]!
      data[di + 1] = data[si + 1]!
      data[di + 2] = data[si + 2]!
      data[di + 3] = data[si + 3]!
    }
  }
  ctx.putImageData(img, 0, 0)
}
