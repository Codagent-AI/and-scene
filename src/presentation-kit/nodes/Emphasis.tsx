import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Emphasis(props: EntityProps) {
  return <Entity {...props} kind="emphasis" />
}
