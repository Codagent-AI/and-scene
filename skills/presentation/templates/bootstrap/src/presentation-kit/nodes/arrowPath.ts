export type Point = readonly [number, number]

/** Quadratic path between two canvas points; the path morphs when its endpoints move. */
export function arrowPath(from: Point, to: Point, bend = 0): string {
  const [x1, y1] = from
  const [x2, y2] = to
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const cx = (x1 + x2) / 2 - (dy / len) * bend
  const cy = (y1 + y2) / 2 + (dx / len) * bend
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}
