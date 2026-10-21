export const SWIPE_MIN_DISTANCE = 50

/** -1 = back, 1 = forward, 0 = not a navigation swipe. Left swipes advance. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  const ax = Math.abs(dx)
  if (ax < SWIPE_MIN_DISTANCE || ax <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}
