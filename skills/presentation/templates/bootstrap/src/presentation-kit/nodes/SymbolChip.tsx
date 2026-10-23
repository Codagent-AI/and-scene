import type { LucideIcon } from 'lucide-react'
import { NodeBase, type NodeProps } from './NodeBase'

export interface SymbolChipProps extends NodeProps {
  symbol: string
  Icon: LucideIcon
}

/** Small glyph-and-text chip. The glyph is a Lucide component. */
export function SymbolChip({ symbol, Icon, children, ...props }: SymbolChipProps) {
  return (
    <NodeBase data-presentation-chip="" data-presentation-symbol={symbol} {...props}>
      <Icon aria-hidden="true" data-presentation-icon="" />
      {children}
    </NodeBase>
  )
}
