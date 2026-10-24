import { MotionNode } from './MotionNode'
import type { NodeProps } from './nodeProps'

/** An emphasis marker (ring, underline, flag) drawn over another entity's bounds. */
export function Emphasis(props: NodeProps) {
  return <MotionNode kind="emphasis" {...props} />
}
