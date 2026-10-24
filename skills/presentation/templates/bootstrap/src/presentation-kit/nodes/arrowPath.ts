export interface Point {
  x: number
  y: number
}

export interface ArrowGeometry {
  from: Point
  to: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset (px) of the control point; 0 draws a straight line. */
  bend?: number
  /** Arrowhead length in design pixels. */
  head?: number
}

const round = (n: number) => Math.round(n * 100) / 100

function chevron(tip: Point, from: Point, head: number) {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const spread = Math.PI / 7
  const a = (side: number) => ({
    x: round(tip.x - head * Math.cos(angle + side * spread)),
    y: round(tip.y - head * Math.sin(angle + side * spread)),
  })
  const l = a(1)
  const r = a(-1)
  return `M ${l.x} ${l.y} L ${tip.x} ${tip.y} L ${r.x} ${r.y}`
}

/** Path for an arrow: a (possibly bent) stroke with open chevron heads. */
export function arrowPath({ from, to, bidirectional, bend = 0, head = 8 }: ArrowGeometry) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const control = {
    x: round((from.x + to.x) / 2 + (dy / length) * bend),
    y: round((from.y + to.y) / 2 - (dx / length) * bend),
  }
  const stroke =
    bend === 0
      ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
      : `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`
  const towards = bend === 0 ? from : control
  const heads = [chevron(to, towards, head)]
  if (bidirectional) heads.push(chevron(from, bend === 0 ? to : control, head))
  return [stroke, ...heads].join(' ')
}

