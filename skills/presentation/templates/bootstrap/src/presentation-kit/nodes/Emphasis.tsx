import { MotionNode } from './MotionNode.tsx'
import type { NodeProps } from './types.ts'

/** Marker (flag, ring, highlight) laid over another entity. */
export function Emphasis(props: NodeProps) {
  return <MotionNode kind="emphasis" tag="div" {...props} />
}
