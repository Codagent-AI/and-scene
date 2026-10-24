import { Entity, type EntityProps } from './Entity'

export type LabelProps = Omit<EntityProps, 'kind' | 'inert' | 'decorative'>

export function Label(props: LabelProps) {
  return <Entity kind="label" {...props} />
}
