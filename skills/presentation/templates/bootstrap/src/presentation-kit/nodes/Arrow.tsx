import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowPoint {
  x: number
  y: number
}

export interface ArrowProps {
  layoutId: string
  from: ArrowPoint
  to: ArrowPoint
  className?: string
}

/** Connector line entity between two design-canvas coordinates; stroke is `currentColor`. */
export function Arrow({ layoutId, from, to, className }: ArrowProps) {
  return (
    <motion.svg
      layout
      layoutId={layoutId}
      data-presentation-arrow=""
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
      transition={{ duration: LAYOUT_T, ease: EASE }}
    >
      <motion.line
        data-presentation-arrow-line=""
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
        stroke="currentColor"
        fill="none"
      />
    </motion.svg>
  )
}
