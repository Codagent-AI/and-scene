import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface LabelProps {
  layoutId: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Label({ layoutId, children, className, style }: LabelProps) {
  return (
    <motion.span style={style} layout layoutId={layoutId} className={`presentation-label${className ? ` ${className}` : ''}`} data-presentation-label data-presentation-entity={layoutId}>
      {children}
    </motion.span>
  )
}
