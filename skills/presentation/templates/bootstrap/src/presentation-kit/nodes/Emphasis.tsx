import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Emphasis(props: EntityProps) {
  return <Entity kind="emphasis" {...props} style={{ pointerEvents: 'none', ...props.style }}/>
}
