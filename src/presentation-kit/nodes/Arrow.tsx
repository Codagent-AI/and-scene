import { motion } from 'motion/react'
import type { SVGAttributes } from 'react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, LAYOUT_T, EASE } from '../constants'

export interface Point {
  x: number
  y: number
}

export interface ArrowProps extends Omit<SVGAttributes<SVGSVGElement>, 'from' | 'to' | 'id'> {
  id: string
  /** Endpoints in design-canvas coordinates; animated in place when they change. */
  from: Point
  to: Point
}

/** A canvas-sized SVG line with an arrowhead; color comes from CSS (`currentColor`). */
export function Arrow({ id, from, to, ...rest }: ArrowProps) {
  const markerId = useId()
  const transition = { duration: LAYOUT_T, ease: EASE }
  return (
    <svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.line
        stroke="currentColor"
        markerEnd={`url(#${markerId})`}
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={transition}
      />
    </svg>
  )
}
