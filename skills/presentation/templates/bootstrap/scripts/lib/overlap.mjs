/**
 * True when any line box of one run overlaps any line box of the other by more than `tolerance` px.
 * A wrapped inline run has one rect per line, so comparing rects (not one union box) keeps the
 * empty corner of a wrapped run from reading as a collision. Self-contained: it is injected into
 * the page as source.
 */
export function collides(aRects, bRects, tolerance = 2) {
  return aRects.some((a) =>
    bRects.some((b) => {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      return w > tolerance && h > tolerance
    }),
  )
}
