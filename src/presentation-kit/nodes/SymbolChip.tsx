import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export type SymbolChipProps = Omit<EntityProps, 'kind'> & {
  Icon?: LucideIcon
  children?: ReactNode
}

export function SymbolChip({ Icon, children, ...rest }: SymbolChipProps) {
  return (
    <Entity kind="symbol-chip" {...rest}>
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
