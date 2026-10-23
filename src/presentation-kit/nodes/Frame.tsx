import { NodeBase, type NodeProps } from './NodeBase'

/** Container drawn around other content. Children may overlap it. */
export function Frame(props: NodeProps) {
  return <NodeBase data-presentation-frame="" {...props} />
}
