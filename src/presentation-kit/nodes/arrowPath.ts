export type Point = readonly [number, number]

export function arrowPath(from: Point, to: Point, bend = 0): string {
  const [x1, y1] = from
  const [x2, y2] = to
  const length = Math.hypot(x2 - x1, y2 - y1) || 1
  const cx = (x1 + x2) / 2 + (-(y2 - y1) / length) * bend
  const cy = (y1 + y2) / 2 + ((x2 - x1) / length) * bend
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}
