import { motion } from 'motion/react'
import { EXIT, LAYOUT_T } from '../constants'

export interface Point {
  x: number
  y: number
}

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Arrowhead length in canvas units. */
  headSize?: number
  className?: string
  style?: React.CSSProperties
}

/** Line with an arrowhead in canvas coordinates. Stroke inherits `currentColor`; no palette is supplied. */
export function Arrow({ id, from, to, headSize = 10, className, style }: ArrowProps) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const head = [Math.PI * 0.85, -Math.PI * 0.85].map((d) => ({
    x: to.x + headSize * Math.cos(angle + d),
    y: to.y + headSize * Math.sin(angle + d),
  }))
  return (
    <motion.svg
      exit={EXIT}
      data-presentation-node="arrow"
      data-presentation-id={id}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
      aria-hidden="true"
    >
      <motion.line
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={LAYOUT_T}
        stroke="currentColor"
      />
      <motion.polyline
        initial={false}
        animate={{ points: `${head[0].x},${head[0].y} ${to.x},${to.y} ${head[1].x},${head[1].y}` }}
        transition={LAYOUT_T}
        fill="none"
        stroke="currentColor"
      />
    </motion.svg>
  )
}
