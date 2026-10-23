import { Entity, type EntityProps } from './Entity'

/** Emphasis marker (halo/flag) placed over other entities. */
export function Emphasis(props: EntityProps) {
  return <Entity kind="emphasis" emphasis {...props} />
}
