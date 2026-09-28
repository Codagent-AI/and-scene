import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { LAYOUT_TRANSITION } from '../constants'

export interface FrameProps {
  layoutId: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Generic grouping/reveal frame primitive; no border, background, or radius defaults. */
export function Frame({ layoutId, className, style, children }: FrameProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={className}
      data-presentation-node="frame"
      style={style}
      transition={LAYOUT_TRANSITION}
    >
      {children}
    </motion.div>
  )
}
