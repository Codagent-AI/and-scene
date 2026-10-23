import { Entity, type EntityProps } from './Entity'

/** A frame drawn around other entities; carries no border of its own. */
export function Frame(props: EntityProps) {
  return <Entity kind="frame" {...props} />
}
