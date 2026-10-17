export interface Point {
  x: number
  y: number
}

export function arrowPath(from: Point, to: Point, curve?: Point): string {
  return curve
    ? `M ${from.x} ${from.y} Q ${curve.x} ${curve.y} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}
