/** SVG path for an arrow; exported so geometry can be asserted. */
export function arrowPath(from: readonly [number, number], to: readonly [number, number], bend = 0) {
  const [x1, y1] = from
  const [x2, y2] = to
  if (!bend) return `M ${x1} ${y1} L ${x2} ${y2}`
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const cx = mx + (-(y2 - y1) / len) * bend
  const cy = my + ((x2 - x1) / len) * bend
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}
