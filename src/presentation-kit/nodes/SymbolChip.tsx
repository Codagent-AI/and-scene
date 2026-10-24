import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  /** Text symbol, used when no icon is given. */
  symbol?: string
}

export function SymbolChip({ Icon, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <Node kind="chip" {...rest}>
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : symbol}
      {children}
    </Node>
  )
}
