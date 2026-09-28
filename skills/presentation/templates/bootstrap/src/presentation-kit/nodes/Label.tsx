import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { LAYOUT_TRANSITION } from '../constants'

export interface LabelProps {
  layoutId?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** Generic text label primitive; no font, size, or color defaults. */
export function Label({ layoutId, className, style, children }: LabelProps) {
  return (
    <motion.span
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      className={className}
      data-presentation-node="label"
      style={style}
      transition={LAYOUT_TRANSITION}
    >
      {children}
    </motion.span>
  )
}
