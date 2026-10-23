import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface SymbolChipProps extends NodeProps {
  /** Short text symbol, or a glyph component. */
  symbol?: string
  Icon?: LucideIcon
}

export function SymbolChip({ symbol, Icon, children, ...props }: SymbolChipProps) {
  return (
    <Node kind="symbol-chip" {...props}>
      {Icon && <Icon data-presentation-icon aria-hidden="true" />}
      {symbol}
      {children}
    </Node>
  )
}
