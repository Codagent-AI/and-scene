import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Label(props: EntityProps) {
  return <Entity kind="label" {...props} />
}
