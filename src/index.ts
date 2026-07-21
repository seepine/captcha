/**
 * @seepine/captcha
 *
 * Library for generating captcha images (slide, click, rotate, ...).
 *
 * Inspired by wenlng/go-captcha (MIT).
 *
 * Public surface is intentionally minimal:
 *   - `generateSlideCaptcha` / `generateClickCaptcha` / `generateRotateCaptcha`
 *   - `validateSlideCaptcha` / `validateClickCaptcha` / `validateRotateCaptcha`
 *   - `validateRotateAngle`
 *   - the data / init / per-axis result types they consume
 *
 * Anything else (the captcha classes, defaults, built-in assets, fonts, ...)
 * is internal. Consumers wanting raw image assets can still import them via
 * the `@seepine/captcha/assets` subpath.
 */
export { validateSlideCaptcha, generateSlideCaptcha } from './slide/captcha'
export { validateClickCaptcha, generateClickCaptcha } from './click/captcha'
export {
  validateRotateCaptcha,
  validateRotateAngle,
  generateRotateCaptcha,
} from './rotate/captcha'

export { registerFont, removeAllFont } from './internal/font'
export type { FontSource } from './internal/font'

export type { Block, SlideCaptchaData, SlideCaptchaInit } from './slide/captcha'
export type {
  ClickDot,
  ClickCaptchaData,
  ClickCaptchaInit,
} from './click/captcha'
export type {
  RotateBlock,
  RotateCaptchaData,
  RotateCaptchaInit,
} from './rotate/captcha'
