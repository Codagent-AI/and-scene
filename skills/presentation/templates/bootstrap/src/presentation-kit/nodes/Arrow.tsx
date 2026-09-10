import type { CSSProperties } from 'react'
import { motion } from 'motion/react'

interface ArrowProps {
  layoutId: string
  className?: string
  style?: CSSProperties
}

export function Arrow({ layoutId, className, style }: ArrowProps) {
  return (
    <motion.svg style={style} layout layoutId={layoutId} className={`presentation-arrow${className ? ` ${className}` : ''}`} data-presentation-arrow data-presentation-entity={layoutId}>
      <path d="M0 0 L100 0" />
    </motion.svg>
  )
}
