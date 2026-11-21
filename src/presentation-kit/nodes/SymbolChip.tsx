import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function SymbolChip(props: EntityProps) {
  return <Entity {...props} kind="symbol-chip" />
}
