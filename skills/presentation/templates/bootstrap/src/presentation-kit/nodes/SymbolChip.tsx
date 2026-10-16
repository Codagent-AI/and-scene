import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface SymbolChipProps extends Placement {
  id: string
  Icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A small symbol-plus-text chip (question mark, check, tag). */
export function SymbolChip({ id, Icon, className, style, children, ...place }: SymbolChipProps) {
  return (
    <motion.span
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="chip"
      data-presentation-id={id}
      className={className}
      style={placementStyle(place, style)}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph /> : null}
      {children}
    </motion.span>
  )
}
