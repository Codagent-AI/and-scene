import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface SymbolChipProps extends Omit<EntityProps, 'kind' | 'inert' | 'decorative'> {
  Icon?: LucideIcon
}

export function SymbolChip({ Icon, children, ...rest }: SymbolChipProps) {
  return (
    <Entity kind="chip" {...rest}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
