import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface SymbolChipProps extends NodeProps {
  /** Icon shown in the chip. */
  Icon?: LucideIcon
  /** Text symbol shown when no icon is supplied. */
  symbol?: string
}

export function SymbolChip({ Icon, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <Node kind="symbol-chip" {...rest}>
      {Icon ? <Icon aria-hidden="true" data-presentation-icon="" /> : symbol}
      {children}
    </Node>
  )
}
