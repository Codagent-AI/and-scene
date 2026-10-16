import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_TRANSITION, rectStyle, type NodeProps, type Rect } from './common.ts'

export interface SymbolChipProps extends NodeProps<'div'> {
  id: string
  at?: Rect
  /** Glyph shown in the chip. */
  Icon?: LucideIcon
  /** `data-state` hook, e.g. "pass" or "fail". */
  state?: string
}

/** A small symbol/status chip: a glyph and/or short text with stable styling hooks. */
export function SymbolChip({ id, at, Icon, state, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="chip"
      data-entity={id}
      data-state={state}
      style={rectStyle(at, style)}
      {...rest}
    >
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
