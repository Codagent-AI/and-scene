import { Entity, type EntityProps } from './Entity'

export type EmphasisProps = Omit<EntityProps, 'kind' | 'inert' | 'decorative' | 'children'>

/** An emphasis marker (ring, highlight) placed over another entity's bounds. */
export function Emphasis({ x = 0, y = 0, ...rest }: EmphasisProps) {
  return <Entity kind="emphasis" inert decorative x={x} y={y} {...rest} />
}
