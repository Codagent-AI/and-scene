import { motion } from 'motion/react'
import type { SVGProps } from 'react'
import { LAYOUT_T } from '../constants'
import type { Point } from './geometry'

export interface ArrowProps extends Omit<SVGProps<SVGGElement>, 'id' | 'ref' | 'from' | 'to'> {
  id: string
  from: Point
  to: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  dashed?: boolean
  /** Sideways offset (canvas px) of the curve midpoint; 0 draws a straight line. */
  bend?: number
}

const HEAD = 8

function control(from: Point, to: Point, bend: number): Point {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: mx - ((to.y - from.y) / len) * bend * 2, y: my + ((to.x - from.x) / len) * bend * 2 }
}

function head(tip: Point, toward: Point) {
  const a = Math.atan2(tip.y - toward.y, tip.x - toward.x)
  const p = (da: number): string =>
    `${tip.x - HEAD * Math.cos(a + da)},${tip.y - HEAD * Math.sin(a + da)}`
  return `${tip.x},${tip.y} ${p(0.45)} ${p(-0.45)}`
}

/**
 * Line or curve (optionally double-headed) between two canvas points. Geometry
 * animates in place when the same id continues across steps. Stroke and fill
 * inherit `currentColor`; the presentation decides the color.
 */
export function Arrow({ id, from, to, bidirectional, dashed, bend = 0, ...rest }: ArrowProps) {
  const c = control(from, to, bend)
  return (
    <svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      width="100%"
      height="100%"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <g {...rest} stroke="currentColor" fill="currentColor" strokeWidth={2}>
        <motion.path
          fill="none"
          initial={false}
          animate={{ d: `M${from.x},${from.y} Q${c.x},${c.y} ${to.x},${to.y}` }}
          transition={LAYOUT_T}
          strokeDasharray={dashed ? '6 5' : undefined}
        />
        <motion.polygon initial={false} animate={{ points: head(to, c) }} transition={LAYOUT_T} stroke="none" />
        {bidirectional && (
          <motion.polygon initial={false} animate={{ points: head(from, c) }} transition={LAYOUT_T} stroke="none" />
        )}
      </g>
    </svg>
  )
}
