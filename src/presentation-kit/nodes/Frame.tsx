import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Frame(props: EntityProps) {
  return <Entity kind="frame" {...props} style={{ pointerEvents: 'none', ...props.style }}/>
}
