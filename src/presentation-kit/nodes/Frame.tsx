import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Frame(props: EntityProps) {
  return <Entity data-presentation-frame="" {...props} />
}
