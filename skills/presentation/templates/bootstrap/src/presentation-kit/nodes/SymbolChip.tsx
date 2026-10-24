import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PositionedNode } from './PositionedNode.tsx'
import type { NodeProps } from './PositionedNode.tsx'

export type SymbolChipProps = NodeProps & {
  /** Icon component, e.g. `icon={Check}`. */
  icon?: LucideIcon
  /** Short text glyph, shown after the icon. */
  symbol?: ReactNode
}

export function SymbolChip({ icon: Icon, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <PositionedNode kind="symbol-chip" {...rest}>
      {Icon && <Icon data-presentation-icon aria-hidden="true" />}
      {symbol}
      {children}
    </PositionedNode>
  )
}
