import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants.ts'
import { arrowPath, type Point } from './arrowPath.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface ArrowProps extends NodeProps {
  from: Point
  to: Point
  /** Draw a head at the start as well. */
  bidirectional?: boolean
  /** Perpendicular offset (design px) of the curve's midpoint; 0 draws a straight line. */
  bend?: number
}

/** Arrow entity drawn over the whole canvas; endpoints are design-canvas coordinates. */
export function Arrow({ id, className, style, from, to, bidirectional, bend, ...rest }: ArrowProps) {
  return (
    <svg
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
      aria-hidden="true"
      {...entityAttrs('arrow', id)}
      {...dataProps(rest)}
    >
      <motion.path
        fill="none"
        stroke="currentColor"
        initial={false}
        animate={{ d: arrowPath({ from, to, bidirectional, bend }) }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
      />
    </svg>
  )
}
