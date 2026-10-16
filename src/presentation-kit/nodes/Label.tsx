import { Entity, type EntityProps } from './Entity'

export type LabelProps = EntityProps

export function Label(props: LabelProps) {
  return <Entity kind="label" {...props} />
}
