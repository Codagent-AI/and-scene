import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface FrameProps {
  layoutId: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A generic grouping/container primitive, e.g. for visually framing a cluster of entities. */
export function Frame({ layoutId, className, style, children }: FrameProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-node="frame" className={className} style={style}>
      {children}
    </motion.div>
  )
}
