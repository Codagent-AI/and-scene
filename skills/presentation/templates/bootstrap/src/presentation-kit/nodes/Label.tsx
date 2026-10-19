import { Entity, type EntityProps } from './Entity'

export type LabelProps = Omit<EntityProps, 'kind'>

export function Label(props: LabelProps) {
  return <Entity kind="label" {...props} />
}
