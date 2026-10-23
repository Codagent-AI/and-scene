export type Point = readonly [x: number, y: number]

export interface ArrowGeometry {
  from: Point
  to: Point
  bidirectional?: boolean
  bend?: number
}

const HEAD = 8

function head(tip: Point, toward: Point): string {
  const angle = Math.atan2(toward[1] - tip[1], toward[0] - tip[0])
  const spread = Math.PI / 7
  const [x, y] = tip
  const a = [x + HEAD * Math.cos(angle + spread), y + HEAD * Math.sin(angle + spread)]
  const b = [x + HEAD * Math.cos(angle - spread), y + HEAD * Math.sin(angle - spread)]
  return `M ${a[0]} ${a[1]} L ${x} ${y} L ${b[0]} ${b[1]}`
}

/**
 * Path with a fixed command structure (line + two heads) so it interpolates between
 * steps. Stroke comes from CSS (`currentColor` by default); width is the SVG default.
 */
export function arrowPath({ from, to, bidirectional, bend = 0 }: ArrowGeometry): string {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy) || 1
  const cx = (from[0] + to[0]) / 2 + (-dy / len) * bend
  const cy = (from[1] + to[1]) / 2 + (dx / len) * bend
  const startHead = bidirectional ? head(from, [cx, cy]) : `M ${from[0]} ${from[1]} L ${from[0]} ${from[1]} L ${from[0]} ${from[1]}`
  return `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]} ${head(to, [cx, cy])} ${startHead}`
}

