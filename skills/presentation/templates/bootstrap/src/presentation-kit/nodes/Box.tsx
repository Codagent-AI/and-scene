import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Box(props: EntityProps) {
  return <Entity kind="box" {...props} />
}
