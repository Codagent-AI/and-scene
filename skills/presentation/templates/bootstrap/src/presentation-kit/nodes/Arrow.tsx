import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, LAYOUT_T } from '../constants.ts'
import { arcControl, arrowHeadPath, arrowShaftPath } from './arrowGeometry.ts'
import type { Point } from './arrowGeometry.ts'

export interface ArrowProps extends Omit<SVGMotionProps<SVGSVGElement>, 'id' | 'layoutId' | 'from' | 'to'> {
  id: string
  from: Point
  to: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Arrow-head length in canvas units. */
  headSize?: number
  /** Bend the shaft into an arc, this many canvas units off the straight line. */
  bend?: number
}

/** Path geometry animates to its new value, so a persisting arrow morphs instead of jumping. */
function morph(d: string) {
  return { initial: false, animate: { d }, transition: { duration: LAYOUT_T, ease: EASE } } as const
}

/**
 * A line with a head at its end (or both ends). Stroke and fill are left to
 * presentation CSS through the hooks, so an unstyled arrow draws nothing.
 */
export function Arrow({ id, from, to, bidirectional = false, headSize = 10, bend = 0, style, ...rest }: ArrowProps) {
  const control = arcControl(from, to, bend)
  return (
    <motion.svg
      data-presentation-arrow=""
      data-presentation-entity={id}
      width={DESIGN_W}
      height={DESIGN_H}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      {...rest}
    >
      <motion.path data-presentation-arrow-line="" {...morph(arrowShaftPath(from, to, bend))} />
      <motion.path data-presentation-arrow-head="" {...morph(arrowHeadPath(control, to, headSize))} />
      {bidirectional ? (
        <motion.path data-presentation-arrow-head="" data-presentation-arrow-tail="" {...morph(arrowHeadPath(control, from, headSize))} />
      ) : null}
    </motion.svg>
  )
}
