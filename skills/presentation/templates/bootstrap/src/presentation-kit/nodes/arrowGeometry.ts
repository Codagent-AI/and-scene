export type Point = readonly [number, number]

/** Control point of a quadratic arc bent `bend` units to the left of travel; the midpoint when 0. */
export function arcControl(from: Point, to: Point, bend: number): Point {
  const mx = (from[0] + to[0]) / 2
  const my = (from[1] + to[1]) / 2
  if (bend === 0) return [mx, my]
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
  return [mx + (-(to[1] - from[1]) / len) * bend, my + ((to[0] - from[0]) / len) * bend]
}

/** SVG path for the shaft: straight when `bend` is 0, otherwise a quadratic arc. */
export function arrowShaftPath(from: Point, to: Point, bend: number): string {
  if (bend === 0) return `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`
  const c = arcControl(from, to, bend)
  return `M ${from[0]} ${from[1]} Q ${c[0]} ${c[1]} ${to[0]} ${to[1]}`
}

/** Triangle path whose tip is at `tip`, pointing away from `tail`. */
export function arrowHeadPath(tail: Point, tip: Point, size: number): string {
  const angle = Math.atan2(tip[1] - tail[1], tip[0] - tail[0])
  const spread = Math.PI / 7
  const corner = (a: number) =>
    `${(tip[0] - size * Math.cos(a)).toFixed(2)} ${(tip[1] - size * Math.sin(a)).toFixed(2)}`
  return `M ${tip[0]} ${tip[1]} L ${corner(angle - spread)} L ${corner(angle + spread)} Z`
}
