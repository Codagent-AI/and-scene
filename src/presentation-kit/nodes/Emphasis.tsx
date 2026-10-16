import { Entity, type EntityProps } from './Entity'
import type { Rect } from './geometry'

export interface EmphasisProps extends EntityProps {
  at: Rect
}

/** Highlight marker (ring, flag, badge) placed over another entity. */
export function Emphasis(props: EmphasisProps) {
  return <Entity kind="emphasis" {...props} />
}
