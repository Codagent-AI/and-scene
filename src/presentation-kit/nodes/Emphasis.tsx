import { Entity, type EntityProps } from './Entity'

/** A marker region that draws attention; it can morph from one target to another. */
export function Emphasis(props: Omit<EntityProps, 'kind'>) {
  return <Entity kind="emphasis" {...props} />
}
