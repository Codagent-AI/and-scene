import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Arrow(props: EntityProps) {
  return <Entity {...props} kind="arrow" />
}
