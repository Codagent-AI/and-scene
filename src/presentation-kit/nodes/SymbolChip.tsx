import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface SymbolChipProps {
  layoutId: string
  icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * A generalized small icon+label chip primitive, for compact entities like
 * tools or roles. No fixed visual treatment; presentation CSS owns the look.
 */
export function SymbolChip({ layoutId, icon: Icon, className, style, children }: SymbolChipProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-node="symbol-chip" className={className} style={style}>
      {Icon ? <Icon aria-hidden="true" data-presentation-node="symbol-chip-icon" /> : null}
      {children}
    </motion.div>
  )
}
