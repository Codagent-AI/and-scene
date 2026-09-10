import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface EmphasisProps {
  layoutId: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function Emphasis({ layoutId, children, className, style }: EmphasisProps) {
  return <motion.div style={style} layout layoutId={layoutId} className={`presentation-emphasis${className ? ` ${className}` : ''}`} data-presentation-emphasis data-presentation-entity={layoutId}>{children}</motion.div>
}
