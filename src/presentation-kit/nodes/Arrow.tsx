import { useId } from 'react'
import { motion } from 'motion/react'
import type { SVGProps } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'

export type Point = readonly [number, number]

export interface ArrowProps extends Omit<SVGProps<SVGSVGElement>, 'from' | 'to' | 'id' | 'ref'> {
  id: string
  /** Start and end in design-canvas coordinates. */
  from: Point
  to: Point
  /** Canvas size the svg overlays. */
  width?: number
  height?: number
}

/** Line with an arrowhead; endpoints animate in place when they change between steps. */
export function Arrow({ id, from, to, width = DESIGN_W, height = DESIGN_H, style, ...rest }: ArrowProps) {
  const markerId = useId()
  const transition = { duration: LAYOUT_T, ease: EASE }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-presentation-entity={id}
      data-presentation-node="arrow"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', ...style }}
      {...rest}
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.line
        data-presentation-arrow-line=""
        stroke="currentColor"
        markerEnd={`url(#${markerId})`}
        initial={false}
        animate={{ x1: from[0], y1: from[1], x2: to[0], y2: to[1] }}
        transition={transition}
      />
    </svg>
  )
}
