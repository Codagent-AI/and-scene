import { Node } from './Node'
import type { NodeProps } from './Node'

export function Label(props: NodeProps) {
  return <Node {...props} kind="label" />
}
