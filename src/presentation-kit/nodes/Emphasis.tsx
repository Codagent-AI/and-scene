import { PositionedNode } from './PositionedNode.tsx'
import type { NodeProps } from './PositionedNode.tsx'

/** A marker highlighting another entity; decorative and allowed to overlap. */
export const Emphasis = (props: NodeProps) => (
  <PositionedNode kind="emphasis" aria-hidden="true" data-presentation-allow-overlap="" {...props} />
)
