import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placementStyle } from './props.ts'
import type { NodeProps } from './props.ts'

interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  /** Semantic state exposed as `data-presentation-state` (for example `pass`). */
  state?: string
}

export function SymbolChip({ id, at, style, Icon, state, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      data-presentation-state={state}
      style={placementStyle(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph aria-hidden="true" /> : null}
      {children}
    </motion.span>
  )
}
