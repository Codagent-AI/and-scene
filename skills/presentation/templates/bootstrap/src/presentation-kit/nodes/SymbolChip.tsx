import { motion } from 'motion/react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface SymbolChipProps {
  layoutId: string
  className?: string
  style?: CSSProperties
  Icon?: ComponentType<{ size?: number; className?: string }>
  iconClassName?: string
  children?: ReactNode
}

/** Generalized icon+label chip primitive; no size, color, or pill-shape defaults. */
export function SymbolChip({ layoutId, className, style, Icon, iconClassName, children }: SymbolChipProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={className}
      data-presentation-node="symbol-chip"
      style={style}
      transition={{ duration: LAYOUT_T, ease: EASE }}
    >
      {Icon ? <Icon size={16} className={iconClassName} /> : null}
      {children}
    </motion.div>
  )
}
