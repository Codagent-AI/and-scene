import { Entity, type EntityProps } from './Entity'

export function Label(props: EntityProps) {
  return <Entity kind="label" {...props} />
}
