import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface SymbolChipProps extends EntityProps {
  /** Glyph shown in the chip; text children are rendered after it. */
  Icon?: LucideIcon
}

export function SymbolChip({ Icon, children, ...props }: SymbolChipProps) {
  return (
    <Entity kind="chip" {...props}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
