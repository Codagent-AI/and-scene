import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface EmphasisProps {
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A generic emphasis marker primitive (e.g. a highlight ring or callout). */
export function Emphasis({ layoutId, className, style, children }: EmphasisProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-node="emphasis" className={className} style={style}>
      {children}
    </motion.div>
  )
}
