import { MotionNode } from './MotionNode'
import type { NodeProps } from './nodeProps'

export function Label(props: NodeProps) {
  return <MotionNode kind="label" as="span" {...props} />
}
