import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export interface SymbolChipProps extends EntityProps {
  Icon?: LucideIcon
  /** Text symbol such as "?" when no icon is used. */
  symbol?: ReactNode
}

export function SymbolChip({ Icon, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <Entity kind="symbol-chip" {...rest}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {symbol !== undefined && <span data-presentation-symbol="">{symbol}</span>}
      {children}
    </Entity>
  )
}
