import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function SymbolChip(props: EntityProps) {
  return <Entity kind="chip" {...props} />
}
