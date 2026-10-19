import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { leave, morph, place } from './shared.ts'
import type { NodeProps } from './shared.ts'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  children?: ReactNode
}

/** Small symbol or short-text chip. */
export function SymbolChip({ layoutId, x, y, w, h, Icon, children, style, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      {...(rest as object)}
      layout
      layoutId={layoutId}
      transition={morph}
      exit={leave}
      style={place({ x, y, w, h }, style)}
      data-presentation-node="chip"
      data-presentation-entity={layoutId}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
