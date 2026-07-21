import { createCanvas, type Canvas } from '@napi-rs/canvas'

/**
 * Internal parameters for {@link DrawImage.drawMaster}.
 */
export interface DrawMasterParams {
  width: number
  height: number
  /** Cropped background image used to fill the master canvas. */
  background: Canvas
  /** Per-block shadow images positioned at `x`, `y` (already rotated). */
  blocks: DrawBlock[]
}

/**
 * Internal parameters for {@link DrawImage.drawTile}.
 */
export interface DrawTileParams {
  width: number
  height: number
  /**
   * The cropped background taken from `(block.x, block.y)` on the master.
   * Pass an already-offset canvas so the tile is exactly the area behind the mask.
   */
  background: Canvas
  /** Alpha mask used to carve out the tile shape (white = keep). */
  maskImage: Canvas
  /** Overlay artwork drawn on top of the tile. */
  overlayImage: Canvas
  block: DrawBlock
}

/**
 * A drawable block: its image plus position/size/angle.
 *
 * The image is already rotated by the caller, so a plain `drawImage` is enough.
 */
export interface DrawBlock {
  x: number
  y: number
  width: number
  height: number
  angle: number
  /** Graph image (already rotated to match `angle`). */
  image: Canvas
}

/**
 * Render graphs onto the master image and produce the tile image.
 *
 * Mirrors `drawImage.DrawWithNRGBA` + `DrawWithTemplate` from go-captcha.
 */
export class DrawImage {
  /**
   * Paint the master image. Returns:
   *   - the final master (background + shadows)
   *   - the bare background (for re-use when composing the tile)
   */
  drawMaster(p: DrawMasterParams): { canvas: Canvas; background: Canvas } {
    const shadowLayer = createCanvas(p.width, p.height)
    const shadowCtx = shadowLayer.getContext('2d')
    for (const b of p.blocks) {
      shadowCtx.drawImage(b.image, b.x, b.y)
    }

    // Snapshot the background for re-use by the tile renderer.
    const rcm = createCanvas(p.width, p.height)
    rcm.getContext('2d').drawImage(p.background, 0, 0)

    const finalMaster = createCanvas(p.width, p.height)
    const finalCtx = finalMaster.getContext('2d')
    finalCtx.drawImage(rcm, 0, 0)
    finalCtx.drawImage(shadowLayer, 0, 0)

    return { canvas: finalMaster, background: rcm }
  }

  /**
   * Render the tile (the piece the user drags).
   *
   * Layout (mirrors go-captcha's `DrawWithTemplate`):
   *   1. bgCvs := cropped background (passed in as `background`, pre-offset).
   *   2. cvs   := bgCvs masked by the alpha mask (only keep pixels where mask is opaque).
   *   3. overlay the foreground artwork on top.
   */
  drawTile(p: DrawTileParams): Canvas {
    const cvs = createCanvas(p.width, p.height)
    const ctx = cvs.getContext('2d')

    ctx.drawImage(p.background, 0, 0)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(p.maskImage, 0, 0)
    ctx.globalCompositeOperation = 'source-over'

    ctx.drawImage(p.overlayImage, 0, 0)

    return cvs
  }
}
