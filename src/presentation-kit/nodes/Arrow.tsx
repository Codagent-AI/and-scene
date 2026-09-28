import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  layoutId: string
  className?: string
  style?: CSSProperties
  /** Rotation in degrees; authors compose direction via style/rotation, not a kit default. */
  rotate?: number
}

/** Generic connector primitive between two entities; no stroke or color defaults. */
export function Arrow({ layoutId, className, style, rotate = 0 }: ArrowProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={className}
      data-presentation-node="arrow"
      style={{ ...style, rotate }}
      transition={{ duration: LAYOUT_T, ease: EASE }}
    />
  )
}
