import { Entity, type EntityProps } from './Entity'

/** A marker placed over another entity to draw attention to it. */
export function Emphasis(props: EntityProps) {
  return <Entity kind="emphasis" aria-hidden {...props} />
}
