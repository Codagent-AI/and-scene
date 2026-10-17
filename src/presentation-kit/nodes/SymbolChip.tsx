import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { entityProps } from './props.ts'
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
      {...entityProps('symbol-chip', id, at, style)}
      data-presentation-state={state}
    >
      {Icon ? <Icon data-presentation-glyph aria-hidden="true" /> : null}
      {children}
    </motion.span>
  )
}
