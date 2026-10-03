import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface BoxProps {
  /** Stable layoutId so this entity morphs across steps instead of remounting. */
  layoutId: string
  /** Optional glyph rendered ahead of the label. */
  icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * A generic bordered-card primitive. Carries no palette, border, shadow, or
 * spacing defaults — presentation-owned CSS targets `data-presentation-node`
 * and the supplied `className`.
 */
export function Box({ layoutId, icon: Icon, className, style, children }: BoxProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-node="box" className={className} style={style}>
      {Icon ? <Icon aria-hidden="true" data-presentation-node="box-icon" /> : null}
      {children}
    </motion.div>
  )
}
