import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface SymbolChipProps extends EntityProps {
  Icon: LucideIcon
  label?: string
}

export function SymbolChip({ Icon, label, children, ...rest }: SymbolChipProps) {
  return (
    <Entity kind="symbol-chip" {...rest}>
      <Icon aria-hidden="true" data-presentation-icon="" />
      {label && <span data-presentation-chip-label="">{label}</span>}
      {children}
    </Entity>
  )
}
