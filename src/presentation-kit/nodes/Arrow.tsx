import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { arrowPath, HEAD_LENGTH, type Point } from './arrowPath'

export interface ArrowProps {
  layoutId?: string
  from: Point
  to: Point
  /** Draw an arrowhead at both ends. */
  bidirectional?: boolean
  className?: string
  [dataAttribute: `data-${string}`]: string | undefined
}


/** Straight arrow between two canvas points, drawn in canvas coordinates. */
export function Arrow({ layoutId, from, to, bidirectional = false, ...rest }: ArrowProps) {
  const left = Math.min(from.x, to.x) - HEAD_LENGTH
  const top = Math.min(from.y, to.y) - HEAD_LENGTH
  const width = Math.abs(to.x - from.x) + 2 * HEAD_LENGTH
  const height = Math.abs(to.y - from.y) + 2 * HEAD_LENGTH
  return (
    <motion.svg
      data-presentation-arrow=""
      layout
      layoutId={layoutId}
      exit={{ opacity: 0 }}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      viewBox={`${left} ${top} ${width} ${height}`}
      style={{ position: 'absolute', left, top, width, height, overflow: 'visible' }}
      {...rest}
    >
      <path d={arrowPath(from, to, bidirectional)} />
    </motion.svg>
  )
}
