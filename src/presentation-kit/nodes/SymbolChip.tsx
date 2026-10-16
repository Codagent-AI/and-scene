import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface SymbolChipProps
  extends Placement,
    Omit<ComponentProps<'span'>, 'id' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  id: string
  Icon?: LucideIcon
  style?: React.CSSProperties
  children?: ReactNode
}

/** Small symbol entity (glyph and/or short text). */
export function SymbolChip({ id, Icon, x, y, w, h, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={placementStyle({ x, y, w, h }, style)}
    >
      {Icon ? <Icon data-presentation-icon aria-hidden="true" /> : null}
      {children}
    </motion.span>
  )
}
