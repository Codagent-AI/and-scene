import { Entity, type EntityProps } from './Entity'

export type EmphasisProps = Omit<EntityProps, 'kind' | 'emphasis'>

/** A marker drawn over another entity's rectangle to flag it. */
export function Emphasis(props: EmphasisProps) {
  return <Entity kind="emphasis" emphasis {...props} />
}
