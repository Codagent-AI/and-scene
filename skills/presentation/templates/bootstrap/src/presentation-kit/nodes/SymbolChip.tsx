import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { withBaseClass } from './classNames'

interface SymbolChipProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'layoutId'> {
  layoutId: string
  children: ReactNode
  Icon?: LucideIcon
}

export function SymbolChip({ layoutId, children, Icon, className, ...props }: SymbolChipProps) {
  return (
    <motion.div
      {...props}
      layout
      layoutId={layoutId}
      className={withBaseClass('presentation-symbol-chip', className)}
      data-presentation-node="symbol-chip"
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph /> : null}
      {children}
    </motion.div>
  )
}
