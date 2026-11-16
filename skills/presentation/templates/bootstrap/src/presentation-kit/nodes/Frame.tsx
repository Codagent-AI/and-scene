import { Node } from './Node'
import type { NodeProps } from './Node'
export function Frame(props: NodeProps) {
  return <Node data-presentation-node="frame" {...props} />
}
