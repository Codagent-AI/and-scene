import { Node } from './Node'
import type { NodeProps } from './Node'

export function Arrow(props: NodeProps) {
  return <Node {...props} kind="arrow" />
}
