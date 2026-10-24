import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, placementStyle, type Placement } from './shared'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  id: string
  at?: Placement
  Icon?: LucideIcon
}

export function SymbolChip({ id, at, Icon, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layoutId={id}
      exit={EXIT}
      data-presentation-entity={id}
      data-presentation-node="symbol-chip"
      style={{ ...placementStyle(at), ...style }}
      {...rest}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden />}
      {children}
    </motion.span>
  )
}
