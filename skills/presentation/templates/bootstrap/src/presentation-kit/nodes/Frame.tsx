import { MotionNode } from './MotionNode.tsx'
import type { NodeProps } from './types.ts'

/** Bounding region drawn around other entities; children are its caption/label. */
export function Frame(props: NodeProps) {
  return <MotionNode kind="frame" tag="div" {...props} />
}
