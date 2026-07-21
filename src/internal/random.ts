/**
 * Random number utilities.
 */

/**
 * Returns an integer in [min, max] (inclusive both ends).
 */
export const randInt = (min: number, max: number): number => {
  if (min > max) [min, max] = [max, min]
  if (min === max) return min
  const range = max - min + 1
  if (range <= 0) return min
  return min + Math.floor(Math.random() * range)
}

/**
 * Returns a random index in [0, length-1], or -1 when length is 0.
 */
export const randIndex = (length: number): number => {
  if (length <= 0) return -1
  return randInt(0, length - 1)
}

/**
 * Returns a random element from the given array, or undefined when empty.
 */
export const pick = <T>(items: readonly T[]): T | undefined => {
  const idx = randIndex(items.length)
  if (idx < 0) return undefined
  return items[idx]
}

/**
 * Picks a random crop offset for an image of size iW x iH into a target width/height.
 * Returns the source point so `drawImage` with sx = -pt.x, sy = -pt.y reveals the crop.
 */
export const rangCutImagePos = (
  width: number,
  height: number,
  iW: number,
  iH: number,
): { x: number; y: number } => {
  let curX = 0
  let curY = 0
  if (iW - width > 0) curX = randInt(0, iW - width)
  if (iH - height > 0) curY = randInt(0, iH - height)
  return { x: curX, y: curY }
}
