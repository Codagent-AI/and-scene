export interface Point {
  x: number
  y: number
}

/** Quadratic path whose control point sits `curve` px off the midpoint. */
export function arrowPath(from: Point, to: Point, curve = 0): string {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * curve
  const cy = my + (dx / len) * curve
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}
