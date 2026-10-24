import { MotionNode } from './MotionNode.tsx'
import type { NodeProps } from './types.ts'

/** Short text entity. */
export function Label(props: NodeProps) {
  return <MotionNode kind="label" tag="span" {...props} />
}
