import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EntityNode, type NodeProps } from './EntityNode'

/** Small symbol entity (a glyph, mark, or short token). */
export function SymbolChip({ symbol, icon, children, ...props }: NodeProps & { symbol?: ReactNode; icon?: LucideIcon }) {
  return (
    <EntityNode kind="symbol-chip" icon={icon} {...props}>
      <span data-presentation-symbol="">{symbol}</span>
      {children}
    </EntityNode>
  )
}
