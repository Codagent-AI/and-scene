import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export interface SymbolChipProps extends Omit<EntityProps, 'kind' | 'children'> {
  symbol: ReactNode
}

export function SymbolChip({ symbol, ...rest }: SymbolChipProps) {
  return (
    <Entity kind="symbol-chip" {...rest}>
      <span data-presentation-symbol="">{symbol}</span>
    </Entity>
  )
}
