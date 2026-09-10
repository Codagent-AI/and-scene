import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface FrameProps {
  layoutId: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function Frame({ layoutId, children, className, style }: FrameProps) {
  return <motion.div style={style} layout layoutId={layoutId} className={`presentation-frame${className ? ` ${className}` : ''}`} data-presentation-frame data-presentation-entity={layoutId}>{children}</motion.div>
}
