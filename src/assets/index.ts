/**
 * @seepine/captcha/assets
 *
 * Individual built-in image resources, exposed as named exports so each
 * asset is a discrete ES module binding. Downstream bundlers can drop any
 * import they do not reference — e.g. `import { bg1, thumb1 }` pulls only
 * those two base64 modules and tree-shakes the rest.
 *
 * Backdrops:
 *   - bg1 … bg16   → 400×340 master backgrounds (jpeg)
 *   - thumb1 … thumb5 → smaller variants referenced by go-captcha
 *
 * Graph tiles (slide puzzle), each set of three channels (mask / shadow / overlay):
 *   - tile1Mask, tile1Shadow, tile1Overlay
 *   - tile2Mask, tile2Shadow, tile2Overlay
 *   - tile3Mask, tile3Shadow, tile3Overlay
 *   - tile4Mask, tile4Shadow, tile4Overlay
 */
export { data as bg1, mime as bg1Mime } from './slide/backgrounds/image_v2_1.ts'
export { data as bg2, mime as bg2Mime } from './slide/backgrounds/image_v2_2.ts'
export { data as bg3, mime as bg3Mime } from './slide/backgrounds/image_v2_3.ts'
export { data as bg4, mime as bg4Mime } from './slide/backgrounds/image_v2_4.ts'
export { data as bg5, mime as bg5Mime } from './slide/backgrounds/image_v2_5.ts'
export { data as bg6, mime as bg6Mime } from './slide/backgrounds/image_v2_6.ts'
export { data as bg7, mime as bg7Mime } from './slide/backgrounds/image_v2_7.ts'
export { data as bg8, mime as bg8Mime } from './slide/backgrounds/image_v2_8.ts'
export { data as bg9, mime as bg9Mime } from './slide/backgrounds/image_v2_9.ts'
export {
  data as bg10,
  mime as bg10Mime,
} from './slide/backgrounds/image_v2_10.ts'
export {
  data as bg11,
  mime as bg11Mime,
} from './slide/backgrounds/image_v2_11.ts'
export {
  data as bg12,
  mime as bg12Mime,
} from './slide/backgrounds/image_v2_12.ts'
export {
  data as bg13,
  mime as bg13Mime,
} from './slide/backgrounds/image_v2_13.ts'
export {
  data as bg14,
  mime as bg14Mime,
} from './slide/backgrounds/image_v2_14.ts'
export {
  data as bg15,
  mime as bg15Mime,
} from './slide/backgrounds/image_v2_15.ts'
export {
  data as bg16,
  mime as bg16Mime,
} from './slide/backgrounds/image_v2_16.ts'

export {
  data as thumb1,
  mime as thumb1Mime,
} from './slide/backgrounds/thumb_1.ts'
export {
  data as thumb2,
  mime as thumb2Mime,
} from './slide/backgrounds/thumb_2.ts'
export {
  data as thumb3,
  mime as thumb3Mime,
} from './slide/backgrounds/thumb_3.ts'
export {
  data as thumb4,
  mime as thumb4Mime,
} from './slide/backgrounds/thumb_4.ts'
export {
  data as thumb5,
  mime as thumb5Mime,
} from './slide/backgrounds/thumb_5.ts'

export {
  data as tile1Mask,
  mime as tile1MaskMime,
} from './slide/tiles/1-mask.ts'
export {
  data as tile1Shadow,
  mime as tile1ShadowMime,
} from './slide/tiles/1-shadow.ts'
export {
  data as tile1Overlay,
  mime as tile1OverlayMime,
} from './slide/tiles/1-overlay.ts'
export {
  data as tile2Mask,
  mime as tile2MaskMime,
} from './slide/tiles/2-mask.ts'
export {
  data as tile2Shadow,
  mime as tile2ShadowMime,
} from './slide/tiles/2-shadow.ts'
export {
  data as tile2Overlay,
  mime as tile2OverlayMime,
} from './slide/tiles/2-overlay.ts'
export {
  data as tile3Mask,
  mime as tile3MaskMime,
} from './slide/tiles/3-mask.ts'
export {
  data as tile3Shadow,
  mime as tile3ShadowMime,
} from './slide/tiles/3-shadow.ts'
export {
  data as tile3Overlay,
  mime as tile3OverlayMime,
} from './slide/tiles/3-overlay.ts'
export {
  data as tile4Mask,
  mime as tile4MaskMime,
} from './slide/tiles/4-mask.ts'
export {
  data as tile4Shadow,
  mime as tile4ShadowMime,
} from './slide/tiles/4-shadow.ts'
export {
  data as tile4Overlay,
  mime as tile4OverlayMime,
} from './slide/tiles/4-overlay.ts'

// Bundled TTF fonts used for click captcha text mode. Import only when you
// want to register them with `@napi-rs/canvas`; consumers who already have a
// font pipeline can skip these assets entirely.
//
//   - clickFont    → DejaVu Sans (Latin)        ~944 KB
//   - clickFontCn  → WenQuanYi Micro Hei (CJK)  ~3.8 MB (GPL+font exception)
export {
  data as dejavuSansFontData,
  mime as dejavuSansFontMime,
  family as dejavuSansFontFamily,
} from './fonts/dejavu-sans.ts'
export {
  data as wqyFontData,
  mime as wqyFontMime,
  family as wqyFontFamily,
  credit as wqyFontCredit,
} from './fonts/wqy-microhei.ts'
