import { Entity, type EntityProps } from './Entity'

/** Wraps a newcomer: it fades in only after persisting entities have moved. */
export function Appear(props: EntityProps) {
  return <Entity kind="appear" {...props} appear />
}
