import { motion, type SVGMotionProps } from 'motion/react'
import { DESIGN_H, DESIGN_W } from '../constants.ts'
import { arrowGeometry } from '../geometry.ts'
import type { Point } from '../types.ts'

export interface ArrowProps extends Omit<SVGMotionProps<SVGSVGElement>, 'from' | 'to' | 'd'> {
  from: Point
  to: Point
  /** Quadratic control point for a curved arrow. */
  via?: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
}

/** Connector drawn in design-canvas coordinates with `currentColor`. */
export function Arrow({ from, to, via, bidirectional, style, ...rest }: ArrowProps) {
  const g = arrowGeometry(from, to, via, bidirectional)
  return (
    <motion.svg
      data-presentation-arrow=""
      width={DESIGN_W}
      height={DESIGN_H}
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <path data-presentation-arrow-line="" d={g.path} fill="none" stroke="currentColor" />
      <polygon data-presentation-arrow-head="" points={g.head} fill="currentColor" />
      {g.tail ? <polygon data-presentation-arrow-tail="" points={g.tail} fill="currentColor" /> : null}
    </motion.svg>
  )
}
