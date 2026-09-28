import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'

export interface SymbolChipProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, 'layout' | 'children'> {
  layoutId: string
  icon?: LucideIcon
  label?: string
  children?: ReactNode
}

/** Generic icon+label pill entity — the reusable, style-neutral replacement for talk-specific nodes. */
export function SymbolChip({ layoutId, icon: Icon, label, children, className, transition, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      data-presentation-symbol-chip=""
      className={className}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {Icon ? <Icon data-presentation-symbol-chip-icon="" aria-hidden="true" /> : null}
      {label ? <span data-presentation-symbol-chip-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
