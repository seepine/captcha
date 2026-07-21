import { Buffer } from 'node:buffer'
import { GlobalFonts } from '@napi-rs/canvas'

import type { Base64String } from './types'

/**
 * Font payload accepted by {@link registerFont}.
 *
 * - `Base64String`: base64-encoded font bytes.
 * - `Buffer` / `Uint8Array`: raw font bytes.
 *
 * Strings are decoded internally with `Buffer.from(s, 'base64')`, so callers
 * don't need to do that themselves.
 */
export type FontSource = Base64String | Buffer | Uint8Array

/** Family names already registered via {@link registerFont}. */
const registered = new Set<string>()

/**
 * Register a font family for use with captcha canvases.
 *
 * Wraps `@napi-rs/canvas`' `GlobalFonts.register` so callers don't need to
 * import the underlying binding directly. Same family registered twice is a
 * no-op (idempotent) — the first registration wins.
 *
 * @param fontName  Logical family name. Must match a string you pass in
 *                  `ClickCaptchaInit.resources.fonts` for text-mode click
 *                  captchas.
 * @param fontData  Base64 string or raw bytes of the font file (TTF / OTF / ...).
 */
export const registerFont = (fontName: string, fontData: FontSource): void => {
  if (registered.has(fontName)) return
  if (GlobalFonts.has(fontName)) {
    throw new Error(`font name [${fontName}] already exists`)
  }
  const buf =
    typeof fontData === 'string'
      ? Buffer.from(fontData, 'base64')
      : Buffer.isBuffer(fontData)
        ? fontData
        : Buffer.from(fontData)
  GlobalFonts.register(buf, fontName)
  registered.add(fontName)
}

export const removeAllFont = (): number => {
  registered.clear()
  return GlobalFonts.removeAll()
}
