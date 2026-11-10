import { Node } from './Node'
import type { NodeProps } from './Node'
export function Emphasis(props: NodeProps) {
  return <Node data-presentation-node="emphasis" {...props} />
}
