import { motion, type SVGMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'
import { arrowGeometry, type Point } from './arrowGeometry.ts'

export interface ArrowProps extends Omit<SVGMotionProps<SVGSVGElement>, 'from' | 'to'> {
  layoutId: string
  from: Point
  to: Point
  bidirectional?: boolean
}

/** A connector between two canvas points; presentations style stroke and fill. */
export function Arrow({ layoutId, from, to, bidirectional, style, ...rest }: ArrowProps) {
  const g = arrowGeometry(from, to, bidirectional)
  return (
    <motion.svg
      layout
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      data-presentation-arrow=""
      data-presentation-id={layoutId}
      aria-hidden="true"
      viewBox={`0 0 ${g.width} ${g.height}`}
      {...rest}
      style={{ position: 'absolute', left: g.left, top: g.top, width: g.width, height: g.height, ...style }}
    >
      <line data-presentation-arrow-line="" {...g.line} />
      {g.heads.map((points, i) => (
        <polygon key={i} data-presentation-arrow-head="" points={points} />
      ))}
    </motion.svg>
  )
}
