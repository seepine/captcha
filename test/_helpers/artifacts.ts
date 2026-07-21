/**
 * Shared helpers for captcha integration tests.
 *
 * Every case follows the same shape:
 *   1. call generate*Captcha() → get back { masterImage, ...image, block/dots }
 *   2. write the artefacts into the case's `output/` folder
 *   3. run the matching validate*Captcha() against the data and assert
 *
 * The helpers below exist purely to make steps 1–3 less noisy in each case
 * — they hold no logic that the cases themselves want to own.
 */
import { Buffer } from 'node:buffer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { ClickDot } from '@/index'

export interface CasePaths {
  /** Absolute path to the case directory (where `output/` lives). */
  caseDir: string
  /** Absolute path to `<caseDir>/output/`. Created on demand. */
  outputDir: string
}

/**
 * Resolve the standard `output/` location for a case and ensure it exists.
 * Pass `__dirname` from a Vitest file.
 */
export const casePaths = (caseDir: string): CasePaths => {
  const outputDir = resolve(caseDir, 'output')
  mkdirSync(outputDir, { recursive: true })
  return { caseDir, outputDir }
}

/** Write a binary file to `<outputDir>/<name>`. */
export const writeBinary = (
  paths: CasePaths,
  name: string,
  data: Buffer,
): void => {
  writeFileSync(resolve(paths.outputDir, name), data)
}

/** Write a pretty-printed JSON file to `<outputDir>/<name>`. */
export const writeJson = (
  paths: CasePaths,
  name: string,
  value: unknown,
): void => {
  writeFileSync(resolve(paths.outputDir, name), JSON.stringify(value, null, 2))
}

/** Magic bytes for PNG (89 50 4E 47) — handy for asserting encoded image types. */
export const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

/** Magic bytes for JPEG (FF D8 FF) — handy for asserting encoded image types. */
export const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

/** Geometric centre of a {@link ClickDot}, in master-image coordinates. */
export const centerOf = (d: ClickDot): { x: number; y: number } => ({
  x: d.x + d.width / 2,
  y: d.y + d.height / 2,
})
