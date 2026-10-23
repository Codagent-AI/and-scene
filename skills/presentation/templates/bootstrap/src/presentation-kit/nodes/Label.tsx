import { NodeBase, type NodeProps } from './NodeBase'

/** Text node. */
export function Label(props: NodeProps) {
  return <NodeBase data-presentation-label="" {...props} />
}
