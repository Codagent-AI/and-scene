export interface Point {
  x: number
  y: number
}

/** SVG path for a straight arrow, or a quadratic curve when `bend` is non-zero. */
export function arrowPath(from: Point, to: Point, bend = 0): string {
  if (!bend) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}
