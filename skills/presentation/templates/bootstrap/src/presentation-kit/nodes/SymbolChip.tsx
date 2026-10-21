import type { LucideIcon } from 'lucide-react'
import { Node } from './Node'
import type { NodeProps } from './Node'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
}

export function SymbolChip({ Icon, children, ...rest }: SymbolChipProps) {
  return (
    <Node kind="chip" {...rest}>
      {Icon ? <Icon data-presentation-icon aria-hidden /> : null}
      {children}
    </Node>
  )
}
