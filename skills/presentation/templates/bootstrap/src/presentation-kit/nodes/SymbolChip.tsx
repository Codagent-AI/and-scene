import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EntityNode } from './EntityNode.tsx'
import type { NodeProps } from './shared.ts'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  children?: ReactNode
}

/** Small symbol or short-text chip. */
export function SymbolChip({ Icon, children, ...rest }: SymbolChipProps) {
  return (
    <EntityNode {...rest} kind="chip">
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </EntityNode>
  )
}
