import type { SVGAttributes } from 'react'
import { DESIGN_H, DESIGN_W } from '../constants.ts'

interface ArrowProps extends Omit<SVGAttributes<SVGSVGElement>, 'id' | 'from' | 'to'> {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset of the curve control point; 0 draws a straight line. */
  bend?: number
}

const HEAD = 8

function head(tip: { x: number; y: number }, tail: { x: number; y: number }) {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x)
  const point = (a: number) => `${tip.x - HEAD * Math.cos(angle + a)},${tip.y - HEAD * Math.sin(angle + a)}`
  return `${tip.x},${tip.y} ${point(0.45)} ${point(-0.45)}`
}

/** Line or arc between two canvas points; stroke and fill come from `currentColor` and CSS. */
export function Arrow({ id, from, to, bidirectional, bend = 0, ...rest }: ArrowProps) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
  const cx = mx - ((to.y - from.y) / length) * bend
  const cy = my + ((to.x - from.x) / length) * bend
  const path = bend ? `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}` : `M${from.x},${from.y} L${to.x},${to.y}`
  const control = bend ? { x: cx, y: cy } : from
  return (
    <svg
      {...rest}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      data-presentation-node="arrow"
      data-presentation-id={id}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...rest.style }}
    >
      <path d={path} fill="none" stroke="currentColor" data-presentation-arrow-line />
      <polygon points={head(to, bend ? control : from)} fill="currentColor" data-presentation-arrow-head />
      {bidirectional ? (
        <polygon points={head(from, bend ? control : to)} fill="currentColor" data-presentation-arrow-head />
      ) : null}
    </svg>
  )
}
