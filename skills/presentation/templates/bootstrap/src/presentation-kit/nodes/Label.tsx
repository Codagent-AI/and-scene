import { Node } from './Node'
import type { NodeProps } from './Node'
export function Label(props: NodeProps) {
  return <Node data-presentation-node="label" {...props} />
}
