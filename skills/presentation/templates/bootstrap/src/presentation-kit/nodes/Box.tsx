import { motion } from 'motion/react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface BoxProps {
  /** Stable layoutId so this entity morphs across steps instead of remounting. */
  layoutId: string
  className?: string
  style?: CSSProperties
  Icon?: ComponentType<{ size?: number; className?: string }>
  iconClassName?: string
  children?: ReactNode
}

/** Generic bordered-card primitive; carries no palette, border, or shadow defaults. */
export function Box({ layoutId, className, style, Icon, iconClassName, children }: BoxProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={className}
      data-presentation-node="box"
      style={style}
      transition={{ duration: LAYOUT_T, ease: EASE }}
    >
      {Icon ? <Icon size={20} className={iconClassName} /> : null}
      {children}
    </motion.div>
  )
}
