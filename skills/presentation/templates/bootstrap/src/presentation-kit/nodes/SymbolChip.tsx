import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { entityProps } from './entity'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  id: string
  Icon?: LucideIcon
  /** Symbol kind hook, e.g. "question". */
  kind?: string
}

export function SymbolChip({ id, Icon, kind, children, transition, ...rest }: SymbolChipProps) {
  return (
    <motion.div {...entityProps(id, 'chip', kind, transition)} {...rest}>
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
