import { motion } from 'motion/react'
import type { CSSProperties } from 'react'

export interface ArrowProps {
  layoutId?: string
  /** SVG path `d` for the arrow's shape, in design-canvas coordinates. */
  d: string
  className?: string
  style?: CSSProperties
}

/** A generic connector primitive rendered as an SVG path. */
export function Arrow({ layoutId, d, className, style }: ArrowProps) {
  return (
    <motion.svg
      layoutId={layoutId}
      data-presentation-node="arrow"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={d} data-presentation-node="arrow-path" />
    </motion.svg>
  )
}
