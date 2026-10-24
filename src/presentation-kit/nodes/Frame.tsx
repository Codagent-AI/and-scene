import { MotionNode } from './MotionNode'
import type { NodeProps } from './nodeProps'

/** A region that groups or surrounds other entities; children are typically its label. */
export function Frame(props: NodeProps) {
  return <MotionNode kind="frame" {...props} />
}
