import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T } from '../constants.ts'

interface Point {
  x: number
  y: number
}

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Quadratic control point; omit for a straight line. */
  curve?: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  className?: string
  /** Marks a subtree whose overlaps are intentional and readable. */
  allowOverlap?: boolean
  width?: number
  height?: number
}

const HEAD = 9

function head(tip: Point, from: Point): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const a = (d: number) => ({
    x: tip.x - HEAD * Math.cos(angle + d),
    y: tip.y - HEAD * Math.sin(angle + d),
  })
  const l = a(0.45)
  const r = a(-0.45)
  return `M ${l.x} ${l.y} L ${tip.x} ${tip.y} L ${r.x} ${r.y}`
}

/** A line or arc between two canvas points; stroke and color come from presentation CSS. */
export function Arrow({
  id,
  from,
  to,
  curve,
  bidirectional,
  className,
  allowOverlap,
  width = DESIGN_W,
  height = DESIGN_H,
}: ArrowProps) {
  const line = curve
    ? `M ${from.x} ${from.y} Q ${curve.x} ${curve.y} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const heads = [head(to, curve ?? from), bidirectional ? head(from, curve ?? to) : ''].join(' ')
  return (
    <motion.svg
      data-presentation-node="arrow"
      data-presentation-entity={id}
      data-presentation-allow-overlap={allowOverlap ? '' : undefined}
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: ENTER_DELAY, duration: ENTER_T }}
    >
      <path data-presentation-arrow-line="" d={line} fill="none" />
      <path data-presentation-arrow-head="" d={heads} fill="none" />
    </motion.svg>
  )
}
