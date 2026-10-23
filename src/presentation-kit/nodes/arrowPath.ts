export interface Point {
  x: number
  y: number
}

/** Room around the line for arrow heads and stroke. */
export const ARROW_PAD = 12

function controlPoint(from: Point, to: Point, curve: number): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  return { x: (from.x + to.x) / 2 + (-dy / len) * curve, y: (from.y + to.y) / 2 + (dx / len) * curve }
}

/** Quadratic path whose control point sits `curve` px off the midpoint. */
export function arrowPath(from: Point, to: Point, curve = 0): string {
  const c = controlPoint(from, to, curve)
  return `M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`
}

/** Canvas-space box around an arrow, so the arrow can morph as a positioned entity. */
export function arrowBox(from: Point, to: Point, curve = 0) {
  const c = controlPoint(from, to, curve)
  // A quadratic stays inside the hull of its three points; the control point over-reaches slightly, which is safe.
  const xs = [from.x, to.x, c.x]
  const ys = [from.y, to.y, c.y]
  const x = Math.min(...xs) - ARROW_PAD
  const y = Math.min(...ys) - ARROW_PAD
  return { x, y, width: Math.max(...xs) + ARROW_PAD - x, height: Math.max(...ys) + ARROW_PAD - y }
}
