import { Entity, type EntityProps } from './Entity'

export function Frame(props: EntityProps) {
  return <Entity kind="frame" {...props} />
}
