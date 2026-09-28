import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

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
      transition={{ duration: LAYOUT_T, ease: EASE }}
    >
      {children}
    </motion.span>
  )
}
