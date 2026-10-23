import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { arrowPath, HEAD_LENGTH, type Point } from './arrowPath'
import { entryMotion, EXIT_MOTION } from './entryMotion'

export interface ArrowProps {
  layoutId?: string
  from: Point
  to: Point
  /** Draw an arrowhead at both ends. */
  bidirectional?: boolean
  /** True while this arrow is newly on screen; see NodeBase. */
  entering?: boolean
  className?: string
  style?: CSSProperties
  [dataAttribute: `data-${string}`]: string | undefined
}


/** Straight arrow between two canvas points, drawn in canvas coordinates. */
export function Arrow({ layoutId, from, to, bidirectional = false, entering = false, style, ...rest }: ArrowProps) {
  const left = Math.min(from.x, to.x) - HEAD_LENGTH
  const top = Math.min(from.y, to.y) - HEAD_LENGTH
  const width = Math.abs(to.x - from.x) + 2 * HEAD_LENGTH
  const height = Math.abs(to.y - from.y) + 2 * HEAD_LENGTH
  return (
    <motion.svg
      data-presentation-arrow=""
      layout
      layoutId={layoutId}
      exit={EXIT_MOTION}
      {...entryMotion(entering)}
      viewBox={`${left} ${top} ${width} ${height}`}
      style={{ position: 'absolute', left, top, width, height, overflow: 'visible', ...style }}
      {...rest}
    >
      <path d={arrowPath(from, to, bidirectional)} />
    </motion.svg>
  )
}
