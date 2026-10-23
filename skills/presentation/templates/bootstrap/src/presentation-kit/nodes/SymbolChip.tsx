import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_T, EASE } from '../constants.ts'
import { placementStyle, type DomPassthrough, type NodeProps, type Placement } from './shared.ts'

export interface SymbolChipProps extends NodeProps, Placement, DomPassthrough {
  children?: ReactNode
}

export function SymbolChip({ id, x, y, w, h, className, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-node="symbol-chip"
      data-presentation-entity={id}
    >
      {children}
    </motion.span>
  )
}
