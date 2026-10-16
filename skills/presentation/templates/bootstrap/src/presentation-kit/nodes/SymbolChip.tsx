import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  id: string
  Icon?: LucideIcon
  /** Symbol kind hook, e.g. "question". */
  kind?: string
}

export function SymbolChip({ id, Icon, kind, children, transition, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="chip"
      data-presentation-entity={id}
      data-presentation-kind={kind}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
